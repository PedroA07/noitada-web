"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { obterMembrosComStatus, sincronizarCargoDiscord, moderarMembro } from '@/lib/services/membros';

export default function MembrosPage() {
  const [membros, setMembros] = useState<any[]>([]);
  const [cargos, setCargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [membroSelecionado, setMembroSelecionado] = useState<any>(null);
  const [abaModal, setAbaModal] = useState<'cargos' | 'moderacao'>('cargos');
  const [pagina, setPagina] = useState(1);
  const porPagina = 20;

  const recarregar = async () => {
    const { membros: m, cargos: c } = await obterMembrosComStatus();
    setMembros(m); setCargos(c); setLoading(false);
  };

  useEffect(() => { recarregar(); }, []);

  const filtrados = membros.filter(m => (m.nick || m.user?.username || '').toLowerCase().includes(busca.toLowerCase()));
  const totalPaginas = Math.ceil(filtrados.length / porPagina);
  const paginados = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
  const statusCor: Record<string, string> = { online: 'bg-green-400', idle: 'bg-yellow-400', dnd: 'bg-red-400', offline: 'bg-gray-600' };

  const handleCargo = async (cargoId: string, tem: boolean) => {
    if (!membroSelecionado) return;
    await sincronizarCargoDiscord(membroSelecionado.user.id, cargoId, !tem);
    await recarregar();
    const atualizado = membros.find((x: any) => x.user.id === membroSelecionado.user.id);
    if (atualizado) setMembroSelecionado(atualizado);
  };

  const handleModeracao = async (acao: string, dados?: any) => {
    if (!membroSelecionado) return;
    if (!confirm(`Confirma a ação "${acao}" para ${membroSelecionado.nick || membroSelecionado.user?.username}?`)) return;
    await moderarMembro(membroSelecionado.user.id, acao as any, dados);
    setMembroSelecionado(null);
    await recarregar();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          Gerenciar <span className="text-fuchsia-400">Membros</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">{membros.length} membros no servidor</p>
      </header>

      <input value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none transition-all"
        placeholder="🔍 Buscar membro..." />

      {loading ? (
        <div className="text-center py-20 text-fuchsia-400 font-black animate-pulse">Carregando membros...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginados.map(m => {
              const avatar = m.user?.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png';
              return (
                <button key={m.user?.id} onClick={() => { setMembroSelecionado(m); setAbaModal('cargos'); }}
                  className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 hover:border-fuchsia-500/50 rounded-2xl transition-all text-left">
                  <div className="relative shrink-0">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10">
                      <Image src={avatar} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${statusCor[m.statusReal] || 'bg-gray-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{m.nick || m.user?.global_name || m.user?.username}</p>
                    <p className="text-xs text-gray-500">{m.isAdmin ? '👑 Admin' : m.isStaff ? '🛡️ Staff' : '👤 Membro'}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-center items-center gap-4 pt-4">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:text-gray-700 transition-colors">Anterior</button>
              <span className="text-fuchsia-400 font-black text-xs bg-white/5 px-4 py-2 rounded-xl border border-fuchsia-500/20">Página {pagina} / {totalPaginas}</span>
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white disabled:text-gray-700 transition-colors">Próxima</button>
            </div>
          )}
        </>
      )}

      {membroSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setMembroSelecionado(null)} />
          <div className="relative bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-fuchsia-500 shrink-0">
                  <Image src={membroSelecionado.user?.avatar ? `https://cdn.discordapp.com/avatars/${membroSelecionado.user.id}/${membroSelecionado.user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">{membroSelecionado.nick || membroSelecionado.user?.username}</h2>
                  <p className="text-xs text-fuchsia-400 font-black uppercase tracking-widest mt-1">ID: {membroSelecionado.user?.id}</p>
                </div>
              </div>
              <button onClick={() => setMembroSelecionado(null)} className="p-2 text-gray-500 hover:text-red-400 transition-colors text-xl">✕</button>
            </div>

            <div className="flex gap-3 mb-6">
              {(['cargos', 'moderacao'] as const).map(a => (
                <button key={a} onClick={() => setAbaModal(a)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${abaModal === a ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                  {a === 'cargos' ? '🏷️ Cargos' : '🔨 Moderação'}
                </button>
              ))}
            </div>

            {abaModal === 'cargos' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Clique para adicionar ou remover</p>
                <div className="flex flex-wrap gap-2">
                  {cargos.filter(c => c.name !== '@everyone').map(c => {
                    const tem = membroSelecionado.roles?.includes(c.id);
                    return (
                      <button key={c.id} onClick={() => handleCargo(c.id, tem)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all border ${tem ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'}`}>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {abaModal === 'moderacao' && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleModeracao('kick')} className="p-4 bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 rounded-xl text-yellow-400 font-black text-sm uppercase tracking-widest transition-all">👢 Expulsar</button>
                <button onClick={() => handleModeracao('ban')} className="p-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-xl text-red-400 font-black text-sm uppercase tracking-widest transition-all">🔨 Banir</button>
                <button onClick={() => handleModeracao('mute', { tempo: '60', unidade: 'minutos' })} className="p-4 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 rounded-xl text-blue-400 font-black text-sm uppercase tracking-widest transition-all">🔇 Mute 1h</button>
                <button onClick={() => { const a = prompt('Novo apelido:'); if (a !== null) handleModeracao('nickname', { apelido: a }); }} className="p-4 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 rounded-xl text-purple-400 font-black text-sm uppercase tracking-widest transition-all">✏️ Apelido</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}