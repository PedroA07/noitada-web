"use client";

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { obterMembrosComStatus, sincronizarCargoDiscord, moderarMembro } from '@/lib/services/membros';
import {
  CrownIcon, ShieldIcon, MemberIcon, TagIcon, HammerIcon,
  KickIcon, MuteIcon, PenIcon, SearchIcon, CloseIcon,
  BanIcon, CheckCircleIcon, XCircleIcon, TimerIcon,
} from '@/lib/icons';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Status = 'online' | 'idle' | 'dnd' | 'offline';

type Membro = {
  user: { id: string; username: string; global_name?: string; avatar?: string };
  nick?: string;
  roles: string[];
  statusReal: Status;
  isAdmin: boolean;
  isStaff: boolean;
  communication_disabled_until?: string | null;
};

type Cargo = { id: string; name: string; color: number; position?: number };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COR_STATUS: Record<Status, string> = {
  online:  'bg-green-400',
  idle:    'bg-yellow-400',
  dnd:     'bg-red-400',
  offline: 'bg-gray-600',
};

const LABEL_STATUS: Record<Status, string> = {
  online:  'Online',
  idle:    'Ausente',
  dnd:     'Ocupado',
  offline: 'Offline',
};

function avatarUrl(m: Membro) {
  return m.user.avatar
    ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
}

function corHex(int: number) {
  if (!int) return '#4B5563';
  return `#${int.toString(16).padStart(6, '0')}`;
}

// ─── Seletor de duração (prazo) ───────────────────────────────────────────────
function SeletorDuracao({
  valor, unidade,
  onValor, onUnidade,
}: {
  valor: number; unidade: string;
  onValor: (v: number) => void; onUnidade: (u: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number" min={1} max={999}
        value={valor}
        onChange={e => onValor(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-16 bg-gray-900/60 border border-gray-700/50 rounded-lg px-2 py-1.5 text-white text-sm focus:border-cyan-500 outline-none text-center"
      />
      {(['minutos', 'horas', 'dias'] as const).map(u => (
        <button
          key={u}
          onClick={() => onUnidade(u)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${
            unidade === u
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-gray-800/50 border-gray-700/40 text-gray-400 hover:text-white'
          }`}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function MembrosPage() {
  const [membros,   setMembros]   = useState<Membro[]>([]);
  const [cargos,    setCargos]    = useState<Cargo[]>([]);
  const [config,    setConfig]    = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [busca,     setBusca]     = useState('');
  const [pagina,    setPagina]    = useState(1);
  const [selecionado, setSelecionado] = useState<Membro | null>(null);
  const [abaModal,  setAbaModal]  = useState<'cargos' | 'moderacao'>('cargos');
  const [msgModal,  setMsgModal]  = useState('');
  const [executando, setExecutando] = useState(false);

  // Estado do usuário logado (para checar privilégios)
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);

  // Campos de moderação
  const [novoApelido,  setNovoApelido]  = useState('');
  const [duracaoVal,   setDuracaoVal]   = useState(5);
  const [duracaoUni,   setDuracaoUni]   = useState('minutos');

  const POR_PAGINA = 24;

  // ── Carregamento inicial ───────────────────────────────────────────────────
  const recarregar = async () => {
    setLoading(true);
    const { membros: m, cargos: c, config: cfg } = await obterMembrosComStatus();
    setMembros(m);
    setCargos(c);
    setConfig(cfg);

    // Qualquer usuário autenticado no dashboard tem permissão de gerenciar cargos.
    // A verificação real de permissão acontece na API do Discord via bot token.
    const { data: { session } } = await supabase.auth.getSession();
    if (session && cfg) {
      const { data: p } = await supabase
        .from('perfis').select('discord_id').eq('id', session.user.id).maybeSingle();
      if (p?.discord_id) {
        const membro = m.find((x: any) => x.user.id === p.discord_id);
        if (membro) {
          setIsAdmin(membro.isAdmin);
          setIsStaff(membro.isStaff || membro.isAdmin);
        } else {
          setIsAdmin(false);
          setIsStaff(false);
        }
      } else {
        setIsAdmin(false);
        setIsStaff(false);
      }
    } else {
      setIsAdmin(false);
      setIsStaff(false);
    }
    setLoading(false);
    return m; // retorna membros frescos para evitar closure obsoleta
  };

  useEffect(() => { recarregar(); }, []);

  // ── Filtragem ──────────────────────────────────────────────────────────────
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return membros;
    return membros.filter(m =>
      (m.nick || m.user.global_name || m.user.username || '').toLowerCase().includes(q) ||
      m.user.id.includes(q),
    );
  }, [membros, busca]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const paginados    = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  // ── Ações de cargo ─────────────────────────────────────────────────────────
  const handleCargo = async (cargoId: string, tem: boolean) => {
    if (!selecionado) return;
    setExecutando(true);
    const resultado = await sincronizarCargoDiscord(selecionado.user.id, cargoId, !tem);
    if (resultado.sucesso) {
      // Recarrega e usa os membros frescos (evita closure obsoleta)
      const membrosAtualizados = await recarregar();
      const atualizado = membrosAtualizados?.find((x: any) => x.user.id === selecionado.user.id);
      if (atualizado) setSelecionado(atualizado);
      mostrarMsg(tem ? 'Cargo removido.' : 'Cargo adicionado.', 'ok');
    } else {
      mostrarMsg(resultado.erro || 'Erro ao gerenciar cargo.', 'erro');
    }
    setExecutando(false);
  };

  // ── Ações de moderação ─────────────────────────────────────────────────────
  const handleModeracao = async (
    acao: Parameters<typeof moderarMembro>[1],
    dados?: any,
  ) => {
    if (!selecionado) return;
    setExecutando(true);
    const resultado = await moderarMembro(selecionado.user.id, acao, dados);
    if (resultado.sucesso) {
      const labels: Record<string, string> = {
        kick:          'Membro expulso.',
        ban:           'Membro banido.',
        timeout:       'Timeout aplicado.',
        remove_timeout:'Timeout removido.',
        voice_mute:    'Microfone desativado.',
        voice_unmute:  'Microfone reativado.',
        nickname:      'Apelido alterado.',
      };
      mostrarMsg(labels[acao] ?? 'Ação aplicada.', 'ok');
      if (['kick', 'ban'].includes(acao)) {
        setSelecionado(null);
        await recarregar();
      }
    } else {
      mostrarMsg(resultado.erro || 'Erro ao executar ação.', 'erro');
    }
    setExecutando(false);
  };

  const mostrarMsg = (texto: string, tipo: 'ok' | 'erro') => {
    setMsgModal(`${tipo}:${texto}`);
    setTimeout(() => setMsgModal(''), 4000);
  };

  const temTimeout = (m: Membro) => {
    if (!m.communication_disabled_until) return false;
    return new Date(m.communication_disabled_until) > new Date();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Cabeçalho */}
      <header className="border-b border-gray-800/60 pb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Gerenciar <span className="text-cyan-400">Membros</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Carregando...' : `${membros.length} membros no servidor`}
          </p>
        </div>
        <button
          onClick={recarregar}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800/60 border border-gray-700/50 hover:border-gray-600 rounded-xl text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </header>

      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          value={busca}
          onChange={e => { setBusca(e.target.value); setPagina(1); }}
          className="w-full bg-gray-900/40 border border-gray-700/50 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition-all"
          placeholder="Buscar por nome ou ID..."
        />
        {busca && (
          <button onClick={() => { setBusca(''); setPagina(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
            <CloseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grade de membros */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-gray-900/40 border border-gray-700/30 rounded-2xl animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 rounded w-3/4" />
                <div className="h-2 bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20 text-gray-600 text-sm">
          Nenhum membro encontrado para "{busca}"
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginados.map(m => {
              const nome = m.nick || m.user.global_name || m.user.username;
              // Cargos visíveis como tags (exclui @everyone)
              const cargosMembro = cargos
                .filter(c => c.name !== '@everyone' && m.roles.includes(c.id))
                .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
                .slice(0, 3); // mostra até 3 tags na lista

              return (
                <button
                  key={m.user.id}
                  onClick={() => { setSelecionado(m); setAbaModal('cargos'); setMsgModal(''); setNovoApelido(''); }}
                  className="flex items-center gap-3 p-4 bg-gray-900/40 border border-gray-700/50 hover:border-cyan-500/40 hover:bg-cyan-500/5 rounded-2xl transition-all text-left group"
                >
                  {/* Avatar + status */}
                  <div className="relative shrink-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-gray-700/60 group-hover:border-cyan-500/30 transition-all">
                      <Image src={avatarUrl(m)} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-gray-900 ${COR_STATUS[m.statusReal]}`}
                      title={LABEL_STATUS[m.statusReal]}
                    />
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-white truncate max-w-[120px]">{nome}</p>
                      {/* Badge de privilégio */}
                      {m.isAdmin
                        ? <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5"><CrownIcon className="w-2.5 h-2.5" />Admin</span>
                        : m.isStaff
                        ? <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded px-1.5 py-0.5"><ShieldIcon className="w-2.5 h-2.5" />Staff</span>
                        : null}
                    </div>

                    {/* ID */}
                    <p className="text-[10px] text-gray-600 font-mono truncate mt-0.5">{m.user.id}</p>

                    {/* Tags de cargo */}
                    {cargosMembro.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cargosMembro.map(c => (
                          <span
                            key={c.id}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                            style={{
                              color:            corHex(c.color),
                              borderColor:      corHex(c.color) + '40',
                              backgroundColor:  corHex(c.color) + '15',
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                        {m.roles.filter(id => cargos.some(c => c.id === id && c.name !== '@everyone')).length > 3 && (
                          <span className="text-[9px] text-gray-500 font-bold px-1 py-0.5">
                            +{m.roles.filter(id => cargos.some(c => c.id === id && c.name !== '@everyone')).length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status textual */}
                  <span className={`text-[10px] font-bold uppercase shrink-0 ${
                    m.statusReal === 'online'  ? 'text-green-400' :
                    m.statusReal === 'idle'    ? 'text-yellow-400' :
                    m.statusReal === 'dnd'     ? 'text-red-400' :
                    'text-gray-600'
                  }`}>
                    {LABEL_STATUS[m.statusReal]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-3 pt-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:text-gray-700 transition-colors"
              >
                Anterior
              </button>
              <span className="text-cyan-400 font-black text-xs bg-cyan-500/10 px-4 py-2 rounded-xl border border-cyan-500/20">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-4 py-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:text-gray-700 transition-colors"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Modal de membro ────────────────────────────────────────────────── */}
      {selecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelecionado(null)} />

          <div className="relative bg-gray-900 border border-gray-700/60 rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">

            {/* Cabeçalho do modal */}
            <div className="flex items-center gap-4 p-6 pb-4 border-b border-gray-800/60 shrink-0">
              <div className="relative">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500 shrink-0">
                  <Image src={avatarUrl(selecionado)} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-gray-900 ${COR_STATUS[selecionado.statusReal]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-white">
                    {selecionado.nick || selecionado.user.global_name || selecionado.user.username}
                  </h2>
                  {selecionado.isAdmin
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-0.5"><CrownIcon className="w-3 h-3" />Admin</span>
                    : selecionado.isStaff
                    ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded px-2 py-0.5"><ShieldIcon className="w-3 h-3" />Staff</span>
                    : <span className="inline-flex items-center gap-1 text-[10px] font-black text-gray-400 bg-gray-800/60 border border-gray-700/40 rounded px-2 py-0.5"><MemberIcon className="w-3 h-3" />Membro</span>
                  }
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {selecionado.user.id}</p>
                <p className={`text-xs font-bold mt-0.5 ${
                  selecionado.statusReal === 'online'  ? 'text-green-400' :
                  selecionado.statusReal === 'idle'    ? 'text-yellow-400' :
                  selecionado.statusReal === 'dnd'     ? 'text-red-400' :
                  'text-gray-600'
                }`}>
                  {LABEL_STATUS[selecionado.statusReal]}
                </p>
              </div>
              <button
                onClick={() => setSelecionado(null)}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800/60 rounded-lg transition-all shrink-0"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              <button
                onClick={() => { setAbaModal('cargos'); setMsgModal(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                  abaModal === 'cargos'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-gray-800/40 border-gray-700/40 text-gray-400 hover:text-white'
                }`}
              >
                <TagIcon className="w-3.5 h-3.5" />Cargos
              </button>
              {(isAdmin || isStaff) && (
                <button
                  onClick={() => { setAbaModal('moderacao'); setMsgModal(''); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                    abaModal === 'moderacao'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-gray-800/40 border-gray-700/40 text-gray-400 hover:text-white'
                  }`}
                >
                  <HammerIcon className="w-3.5 h-3.5" />Moderação
                </button>
              )}
            </div>

            {/* Mensagem de feedback */}
            {msgModal && (() => {
              const isOk = msgModal.startsWith('ok:');
              const texto = msgModal.replace(/^(ok:|erro:)/, '');
              return (
                <div className={`mx-6 mt-3 flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl border shrink-0 ${
                  isOk
                    ? 'text-green-400 bg-green-500/10 border-green-500/30'
                    : 'text-red-400 bg-red-500/10 border-red-500/30'
                }`}>
                  {isOk ? <CheckCircleIcon className="w-4 h-4 shrink-0" /> : <XCircleIcon className="w-4 h-4 shrink-0" />}
                  {texto}
                </div>
              );
            })()}

            {/* Conteúdo das abas */}
            <div className="overflow-y-auto flex-1 p-6 pt-4 custom-scrollbar">

              {/* ─ ABA CARGOS ─────────────────────────────────────────────── */}
              {abaModal === 'cargos' && (
                <div className="space-y-4">
                  {!isStaff && !isAdmin ? (
                    <p className="text-gray-500 text-sm">Você não tem permissão para gerenciar cargos.</p>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                        Clique para adicionar ou remover
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cargos
                          .filter(c => c.name !== '@everyone')
                          .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
                          .map(c => {
                            const tem = selecionado.roles.includes(c.id);
                            const cor = corHex(c.color);
                            return (
                              <button
                                key={c.id}
                                onClick={() => handleCargo(c.id, tem)}
                                disabled={executando}
                                className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all border disabled:opacity-50"
                                style={tem ? {
                                  color:           cor,
                                  borderColor:     cor + '60',
                                  backgroundColor: cor + '20',
                                } : {
                                  color:           '#9CA3AF',
                                  borderColor:     'rgba(255,255,255,0.08)',
                                  backgroundColor: 'transparent',
                                }}
                              >
                                {c.name}
                              </button>
                            );
                          })}
                      </div>
                    </>
                  )}

                  {/* Todos os cargos do membro como lista */}
                  <div className="pt-2 border-t border-gray-800/60">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Cargos atuais</p>
                    <div className="flex flex-wrap gap-1.5">
                      {cargos
                        .filter(c => c.name !== '@everyone' && selecionado.roles.includes(c.id))
                        .sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
                        .map(c => (
                          <span
                            key={c.id}
                            className="text-xs font-bold px-2 py-1 rounded border"
                            style={{
                              color:           corHex(c.color),
                              borderColor:     corHex(c.color) + '50',
                              backgroundColor: corHex(c.color) + '18',
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      {!cargos.some(c => c.name !== '@everyone' && selecionado.roles.includes(c.id)) && (
                        <span className="text-xs text-gray-600">Nenhum cargo</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─ ABA MODERAÇÃO ──────────────────────────────────────────── */}
              {abaModal === 'moderacao' && (
                <div className="space-y-3">

                  {/* Timeout — suspender mensagens por prazo */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/40 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <TimerIcon className="w-4 h-4 text-orange-400" />
                      <p className="text-sm font-black text-white">Suspender mensagens (Timeout)</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Impede o membro de enviar mensagens e entrar em canais de voz pelo prazo definido.
                    </p>
                    <SeletorDuracao
                      valor={duracaoVal} unidade={duracaoUni}
                      onValor={setDuracaoVal} onUnidade={setDuracaoUni}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModeracao('timeout', { valor: duracaoVal, unidade: duracaoUni })}
                        disabled={executando}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-500/15 border border-orange-500/30 hover:bg-orange-500/25 rounded-xl text-orange-400 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        <TimerIcon className="w-4 h-4" /> Aplicar Timeout
                      </button>
                      {temTimeout(selecionado) && (
                        <button
                          onClick={() => handleModeracao('remove_timeout')}
                          disabled={executando}
                          className="px-4 py-2.5 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 rounded-xl text-green-400 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mutar voz */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <MuteIcon className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-black text-white">Silenciar microfone (Voz)</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Desativa o microfone do membro em todos os canais de voz do servidor.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleModeracao('voice_mute')}
                        disabled={executando}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/25 rounded-xl text-blue-400 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        <MuteIcon className="w-4 h-4" /> Mutar
                      </button>
                      <button
                        onClick={() => handleModeracao('voice_unmute')}
                        disabled={executando}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/15 border border-green-500/30 hover:bg-green-500/25 rounded-xl text-green-400 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        Desmutar
                      </button>
                    </div>
                  </div>

                  {/* Apelido */}
                  <div className="p-4 bg-gray-800/30 border border-gray-700/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2">
                      <PenIcon className="w-4 h-4 text-violet-400" />
                      <p className="text-sm font-black text-white">Alterar apelido</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={novoApelido}
                        onChange={e => setNovoApelido(e.target.value)}
                        placeholder="Novo apelido (deixe vazio para remover)"
                        className="flex-1 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                      />
                      <button
                        onClick={() => handleModeracao('nickname', { apelido: novoApelido })}
                        disabled={executando}
                        className="px-4 py-2 bg-violet-500/15 border border-violet-500/30 hover:bg-violet-500/25 rounded-xl text-violet-400 font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>

                  {/* Expulsar e Banir */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (!confirm(`Expulsar ${selecionado.nick || selecionado.user.username}?`)) return;
                        handleModeracao('kick');
                      }}
                      disabled={executando}
                      className="flex flex-col items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 rounded-2xl text-yellow-400 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      <KickIcon className="w-5 h-5" /> Expulsar
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Banir ${selecionado.nick || selecionado.user.username} permanentemente?`)) return;
                        handleModeracao('ban');
                      }}
                      disabled={executando}
                      className="flex flex-col items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-2xl text-red-400 font-black text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      <BanIcon className="w-5 h-5" /> Banir
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
