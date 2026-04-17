"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Heart, Trophy, Palette } from 'lucide-react';
import {
  CardIcon, GlobeIcon, GearIcon, ListIcon, DiceIcon,
  TimerIcon, BoxIcon, ClockIcon, TagIcon, StatusMsg,
  SearchIcon, CloseIcon,
} from '@/lib/icons';

type Aba = 'globais' | 'boasvindas' | 'hierarquias' | 'cargos' | 'cartas' | 'cores';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function corHex(int: number) {
  if (!int) return '#4B5563';
  return `#${int.toString(16).padStart(6, '0')}`;
}

// ─── Seletor de Canal Discord ─────────────────────────────────────────────────
function SeletorCanal({
  value, onChange, placeholder = 'Selecione um canal',
}: {
  value: string; onChange: (id: string) => void; placeholder?: string;
}) {
  const [canais, setCanais] = useState<any[]>([]);
  const [aberto, setAberto] = useState(false);
  const [busca,  setBusca]  = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/discord/canais')
      .then(r => r.ok ? r.json() : [])
      .then(setCanais)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtrados = canais.filter(c =>
    c.name.toLowerCase().includes(busca.toLowerCase()),
  );
  const selecionado = canais.find(c => c.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center gap-2 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm focus:border-cyan-500 outline-none transition-all text-left hover:border-gray-600"
      >
        <span className="text-gray-500 font-mono text-xs">#</span>
        <span className={`flex-1 truncate ${selecionado ? 'text-white' : 'text-gray-500'}`}>
          {selecionado ? selecionado.name : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${aberto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-800/60">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                autoFocus
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar canal..."
                className="w-full bg-gray-800/60 border border-gray-700/40 rounded-lg pl-8 pr-3 py-2 text-white text-xs outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => { onChange(''); setBusca(''); setAberto(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-gray-500 hover:bg-gray-800/50 transition-colors text-left"
            >
              Nenhum canal
            </button>
            {filtrados.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setBusca(''); setAberto(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${
                  c.id === value
                    ? 'bg-cyan-500/10 text-cyan-300'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span className="text-gray-500 font-mono">#</span>
                {c.name}
                {c.id === value && (
                  <svg className="w-3 h-3 text-cyan-400 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="px-4 py-3 text-xs text-gray-600">Nenhum canal encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Botão de cargo com cor Discord ──────────────────────────────────────────
function BotaoCargo({
  cargo, selecionado, onClick,
}: {
  cargo: any; selecionado: boolean; onClick: () => void;
}) {
  const cor = corHex(cargo.color);
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border"
      style={selecionado ? {
        color: cor, borderColor: cor + '80', background: cor + '25',
        boxShadow: `0 0 8px ${cor}30`,
      } : {
        color: cor === '#4B5563' ? '#9CA3AF' : cor + 'cc',
        borderColor: cor + '35',
        background: cor + '0a',
      }}
    >
      {cargo.name}
    </button>
  );
}

// ─── Embed Discord (componente de layout fiel) ────────────────────────────────
// Replica o visual exato do Discord dark mode
function DiscordEmbed({
  cor, children,
}: {
  cor: string; children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-sm overflow-hidden max-w-[520px]"
      style={{
        background: '#2B2D31',
        borderLeft: `4px solid ${cor}`,
        fontFamily: '"Whitney","Helvetica Neue",Helvetica,Arial,sans-serif',
      }}
    >
      <div style={{ padding: '8px 16px 16px 12px' }}>
        {children}
      </div>
    </div>
  );
}

function DiscordEmbedAutor() {
  return (
    <div className="flex items-center gap-1.5 mb-2 mt-1">
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 16, height: 16, background: '#5865F2' }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026 13.83 13.83 0 001.226-1.963.074.074 0 00-.041-.104 13.175 13.175 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028z"/>
        </svg>
      </div>
      <span style={{ color: '#F2F3F5', fontWeight: 600, fontSize: 13 }}>Noitada</span>
      <span style={{
        background: '#5865F2', color: '#fff', fontSize: 9,
        padding: '1px 4px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5,
      }}>
        APP
      </span>
    </div>
  );
}

function DiscordEmbedTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 16, marginBottom: 8, lineHeight: '22px' }}>
      {children}
    </div>
  );
}

function DiscordEmbedDesc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#DBDEE1', fontSize: 14, lineHeight: '1.375rem', whiteSpace: 'pre-wrap', marginBottom: 8 }}>
      {children}
    </div>
  );
}

function DiscordEmbedField({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ color: '#DBDEE1', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{name}</div>
      <div style={{ color: '#DBDEE1', fontSize: 14 }}>{children}</div>
    </div>
  );
}

function DiscordEmbedFooter({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: '#949BA4', fontSize: 12, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#5865F2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="white">
          <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026 13.83 13.83 0 001.226-1.963.074.074 0 00-.041-.104 13.175 13.175 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028z"/>
        </svg>
      </div>
      {children}
    </div>
  );
}

// Menção de role (como aparece no Discord)
function DiscordRoleMention({ nome, cor }: { nome: string; cor: string }) {
  const hex = cor === '#4B5563' ? '#5865F2' : cor;
  return (
    <span style={{
      color: hex,
      background: hex + '26',
      borderRadius: 3,
      padding: '0 3px',
      fontWeight: 500,
      fontSize: 14,
      display: 'inline-block',
      margin: '1px 2px',
    }}>
      @{nome}
    </span>
  );
}

// Mensagem fora do embed (texto plano)
function DiscordMsg({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: '"Whitney","Helvetica Neue",Helvetica,Arial,sans-serif',
      fontSize: 14, color: '#DCDDDE',
      marginBottom: 4,
    }}>
      {text}
    </div>
  );
}

// ─── Preview: Embed de Boas-Vindas ────────────────────────────────────────────
function PreviewBoasVindas({ form }: { form: any }) {
  const cor    = form.cor_boas_vindas || '#EC4899';
  const titulo = form.titulo_boas_vindas || 'Título do embed';
  const desc   = form.descricao_boas_vindas || 'Descrição do embed';
  const banner = form.banner_boas_vindas;
  const msg    = form.mensagem_boas_vindas;
  const avatar = form.mostrar_avatar_boas_vindas;

  // Substitui @NovoMembro por menção simulada
  const renderTexto = (t: string) =>
    t.split('@NovoMembro').map((parte, i) => (
      <span key={i}>
        {parte}
        {i < t.split('@NovoMembro').length - 1 && (
          <span style={{ color: '#5865F2', background: '#5865F226', borderRadius: 3, padding: '0 3px' }}>
            @NovaMembro
          </span>
        )}
      </span>
    ));

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Pré-visualização</p>

      {/* Wrapper estilo fundo do Discord */}
      <div style={{ background: '#313338', borderRadius: 8, padding: '12px 16px' }}>
        {/* Mensagem fora do embed */}
        {msg && <DiscordMsg text={msg.replace('@NovoMembro', '')} />}
        {msg && (
          <div style={{ fontFamily: '"Whitney","Helvetica Neue",Helvetica,Arial,sans-serif', fontSize: 14, color: '#DCDDDE', marginBottom: 4 }}>
            {renderTexto(msg)}
          </div>
        )}

        <DiscordEmbed cor={cor}>
          <DiscordEmbedAutor />
          <DiscordEmbedTitle>{titulo}</DiscordEmbedTitle>
          {desc && <DiscordEmbedDesc>{renderTexto(desc)}</DiscordEmbedDesc>}

          {avatar && (
            <div className="flex items-center gap-2 mt-2">
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>
                N
              </div>
              <span style={{ color: '#F2F3F5', fontSize: 13 }}>@NovaMembro</span>
            </div>
          )}

          {banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner} alt="banner"
              className="w-full object-cover rounded mt-3"
              style={{ maxHeight: 160 }}
              onError={e => (e.currentTarget.style.display = 'none')}
            />
          )}
        </DiscordEmbed>
      </div>

      <p className="text-[10px] text-gray-600">
        Use <code className="bg-gray-800 px-1 rounded">@NovoMembro</code> para mencionar o usuário
      </p>
    </div>
  );
}

// ─── Preview: Cargos Globais ──────────────────────────────────────────────────
function PreviewGlobais({ form, cargos }: { form: any; cargos: any[] }) {
  const encontrar = (id: string) => cargos.find(c => c.id === id);
  const niveis = [
    { label: 'Membro',         id: form.cargo_membro_id, acento: '#3BA55C' },
    { label: 'Staff/Moderador',id: form.cargo_staff_id,  acento: '#FAA81A' },
    { label: 'Administrador',  id: form.cargo_admin_id,  acento: '#ED4245' },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pré-visualização</p>
      <div className="space-y-2">
        {niveis.map(n => {
          const cargo = encontrar(n.id);
          const cor   = cargo ? corHex(cargo.color) : '#4B5563';
          return (
            <div key={n.label} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: n.acento }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{n.label}</p>
                {cargo
                  ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cor }} />
                      <p className="text-sm font-bold" style={{ color: cor }}>{cargo.name}</p>
                    </div>
                  )
                  : <p className="text-xs text-gray-600 mt-0.5 italic">Não configurado</p>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Preview: Hierarquias ─────────────────────────────────────────────────────
function PreviewHierarquias({ form, cargos }: { form: any; cargos: any[] }) {
  const porId = (ids: string[]) => ids.map(id => cargos.find(c => c.id === id)).filter(Boolean);
  const secoes = [
    { quem: porId(form.quem_pode_dar_comuns),    pode: porId(form.cargos_comuns),    titulo: 'Cargos Comuns' },
    { quem: porId(form.quem_pode_dar_moderacao), pode: porId(form.cargos_moderacao), titulo: 'Cargos de Moderação' },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pré-visualização</p>
      {secoes.map(s => (
        <div key={s.titulo} className="p-3 bg-gray-800/50 rounded-xl space-y-2">
          <p className="text-xs font-black text-white uppercase tracking-widest">{s.titulo}</p>
          <div className="flex items-start gap-3 text-xs">
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Quem pode distribuir:</p>
              <div className="flex flex-wrap gap-1">
                {s.quem.length === 0
                  ? <span className="text-gray-600 italic">Nenhum</span>
                  : s.quem.map((c: any) => <DiscordRoleMention key={c.id} nome={c.name} cor={corHex(c.color)} />)
                }
              </div>
            </div>
            <div className="text-gray-600 pt-4">→</div>
            <div className="flex-1">
              <p className="text-gray-500 mb-1">Cargos disponíveis:</p>
              <div className="flex flex-wrap gap-1">
                {s.pode.length === 0
                  ? <span className="text-gray-600 italic">Nenhum</span>
                  : s.pode.map((c: any) => <DiscordRoleMention key={c.id} nome={c.name} cor={corHex(c.color)} />)
                }
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Preview: Lista de Cargos ─────────────────────────────────────────────────
function PreviewCargos({ cargos }: { cargos: any[] }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pré-visualização — Cargos do Servidor</p>
      <div className="flex flex-wrap gap-1.5">
        {cargos.filter(c => c.name !== '@everyone').map(c => {
          const cor = corHex(c.color);
          return (
            <span key={c.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ color: cor, background: cor + '22', border: `1px solid ${cor}55` }}>
              <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: cor }} />
              {c.name}
            </span>
          );
        })}
        {cargos.filter(c => c.name !== '@everyone').length === 0 && (
          <span className="text-gray-600 text-xs italic">Nenhum cargo encontrado</span>
        )}
      </div>
    </div>
  );
}

// ─── Preview: Sistema de Cartas ───────────────────────────────────────────────
function PreviewCartas({ configSistema, configsRoll }: { configSistema: any; configsRoll: any[] }) {
  const hh = String(configSistema.reset_capturas_hora   ?? 0).padStart(2, '0');
  const mm = String(configSistema.reset_capturas_minuto ?? 0).padStart(2, '0');
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Pré-visualização</p>
      <div className="p-4 bg-gray-800/50 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-white">Sistema Global</p>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
            configSistema.ativo
              ? 'text-green-400 bg-green-500/10 border-green-500/30'
              : 'text-red-400 bg-red-500/10 border-red-500/30'
          }`}>
            {configSistema.ativo ? 'ATIVO' : 'INATIVO'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <span>Spawn: <strong className="text-cyan-400">{configSistema.intervalo_spawn_minutos} min</strong></span>
          <span>Reset: <strong className="text-cyan-400">{hh}:{mm}</strong></span>
          <span className="col-span-2">Canal: <strong className="text-cyan-400 font-mono">{configSistema.canal_spawn_id || 'Não configurado'}</strong></span>
        </div>
      </div>
      {configsRoll.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Limites por Cargo</p>
          {configsRoll.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-800/40 rounded-xl">
              <span className="text-sm font-bold text-white">{c.cargo_nome}</span>
              <div className="flex gap-3 text-xs text-gray-400">
                <span><span className="text-cyan-400 font-bold">{c.cartas_por_roll}</span> carta/roll</span>
                <span><span className="text-green-400 font-bold">{c.capturas_por_dia}</span> cap/dia</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Preview: Embed de Cores ──────────────────────────────────────────────────
function PreviewCores({ form, cargos }: { form: any; cargos: any[] }) {
  const cor        = form.cor_embed || '#EC4899';
  const titulo     = form.titulo_embed || '🎨 Cargos de Cor';
  const solidos    = (form.cargos_solidos    || []).map((id: string) => cargos.find(c => c.id === id)).filter(Boolean);
  const gradientes = (form.cargos_gradientes || []).map((id: string) => cargos.find(c => c.id === id)).filter(Boolean);

  // Gradientes predefinidos para preview (o Discord Nitro usa gradientes reais)
  const grads = [
    'linear-gradient(135deg,#a855f7,#ec4899)',
    'linear-gradient(135deg,#3b82f6,#06b6d4)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
    'linear-gradient(135deg,#10b981,#3b82f6)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#f97316,#f59e0b)',
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Pré-visualização</p>

      <div style={{ background: '#313338', borderRadius: 8, padding: '12px 16px' }}>
        <DiscordEmbed cor={cor}>
          <DiscordEmbedAutor />
          <DiscordEmbedTitle>{titulo}</DiscordEmbedTitle>

          {solidos.length > 0 && (
            <DiscordEmbedField name="🎨 Cores Sólidas">
              <div className="flex flex-wrap gap-1 mt-1">
                {solidos.map((c: any) => (
                  <DiscordRoleMention key={c.id} nome={c.name} cor={corHex(c.color)} />
                ))}
              </div>
            </DiscordEmbedField>
          )}

          {gradientes.length > 0 && (
            <DiscordEmbedField name="✨ Gradientes">
              <div className="flex flex-wrap gap-1 mt-1">
                {gradientes.map((c: any, i: number) => (
                  <span key={c.id}
                    style={{
                      background: grads[i % grads.length],
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: 500, fontSize: 14,
                      padding: '0 3px', margin: '1px 2px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 3, display: 'inline-block',
                    }}
                  >
                    @{c.name}
                  </span>
                ))}
              </div>
            </DiscordEmbedField>
          )}

          {solidos.length === 0 && gradientes.length === 0 && (
            <DiscordEmbedDesc>Selecione cargos para visualizar o embed</DiscordEmbedDesc>
          )}

          <DiscordEmbedFooter>NOITADA · Sistema de Cores</DiscordEmbedFooter>
        </DiscordEmbed>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BotPage() {
  const [aba,     setAba]     = useState<Aba>('globais');
  const [cargos,  setCargos]  = useState<any[]>([]);
  const [salvando,      setSalvando]      = useState(false);
  const [msg,           setMsg]           = useState('');
  const [nomeCargo,     setNomeCargo]     = useState('');
  const [corCargo,      setCorCargo]      = useState('#9333ea');
  const [criando,       setCriando]       = useState(false);
  const [salvandoRoll,    setSalvandoRoll]    = useState(false);
  const [msgRoll,         setMsgRoll]         = useState('');
  const [salvandoSistema, setSalvandoSistema] = useState(false);
  const [msgSistema,      setMsgSistema]      = useState('');
  const [salvandoCores,   setSalvandoCores]   = useState(false);
  const [msgCores,        setMsgCores]        = useState('');
  const [enviandoCores,   setEnviandoCores]   = useState(false);

  const [formGlobais, setFormGlobais] = useState({
    cargo_membro_id: '', cargo_staff_id: '', cargo_admin_id: '',
  });
  const [formBoas, setFormBoas] = useState({
    canal_boas_vindas_id: '',
    titulo_boas_vindas: '',
    descricao_boas_vindas: '',
    mensagem_boas_vindas: '',
    cor_boas_vindas: '#EC4899',
    banner_boas_vindas: '',
    mostrar_avatar_boas_vindas: true,
  });
  const [formHierarquias, setFormHierarquias] = useState({
    cargos_comuns:           [] as string[],
    quem_pode_dar_comuns:    [] as string[],
    cargos_moderacao:        [] as string[],
    quem_pode_dar_moderacao: [] as string[],
  });
  const [configsRoll, setConfigsRoll] = useState<any[]>([]);
  const [formRoll, setFormRoll] = useState<any>({
    cargo_id: '', cargo_nome: '',
    cooldown_valor: 30, cooldown_unidade: 'minutos',
    rolls_por_periodo: 5, cartas_por_roll: 1,
    capturas_por_dia: 10, cooldown_captura_segundos: 30,
  });
  const [configSistema, setConfigSistema] = useState<any>({
    intervalo_spawn_minutos: 60, canal_spawn_id: '',
    reset_capturas_hora: 0, reset_capturas_minuto: 0, ativo: true,
  });
  const [formCores, setFormCores] = useState<any>({
    canal_cores_id: '', titulo_embed: '🎨 Cargos de Cor',
    cor_embed: '#EC4899', cargos_solidos: [], cargos_gradientes: [],
  });

  // ── Carregamento ─────────────────────────────────────────────────────────
  useEffect(() => {
    const carregar = async () => {
      const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: cfg } = await supabase
        .from('configuracoes_servidor').select('*')
        .eq('guild_id', guildId).maybeSingle();

      if (cfg) {
        setFormGlobais({
          cargo_membro_id: cfg.cargo_membro_id || '',
          cargo_staff_id:  cfg.cargo_staff_id  || '',
          cargo_admin_id:  cfg.cargo_admin_id  || '',
        });
        setFormBoas({
          canal_boas_vindas_id:       cfg.canal_boas_vindas_id       || '',
          titulo_boas_vindas:         cfg.titulo_boas_vindas         || '',
          descricao_boas_vindas:      cfg.descricao_boas_vindas      || '',
          mensagem_boas_vindas:       cfg.mensagem_boas_vindas       || '',
          cor_boas_vindas:            cfg.cor_boas_vindas            || '#EC4899',
          banner_boas_vindas:         cfg.banner_boas_vindas         || '',
          mostrar_avatar_boas_vindas: cfg.mostrar_avatar_boas_vindas !== false,
        });
        setFormHierarquias({
          cargos_comuns:           cfg.cargos_comuns           || [],
          quem_pode_dar_comuns:    cfg.quem_pode_dar_comuns    || [],
          cargos_moderacao:        cfg.cargos_moderacao        || [],
          quem_pode_dar_moderacao: cfg.quem_pode_dar_moderacao || [],
        });
      }

      const resCargos = await fetch('/api/discord/cargos');
      if (resCargos.ok) setCargos(await resCargos.json());

      const resRoll = await fetch('/api/configuracoes-roll');
      if (resRoll.ok) setConfigsRoll(await resRoll.json());

      const resSistema = await fetch('/api/configuracoes-cartas-sistema');
      if (resSistema.ok) { const d = await resSistema.json(); if (d) setConfigSistema(d); }

      const resCores = await fetch('/api/configuracoes-cores');
      if (resCores.ok) { const d = await resCores.json(); if (d) setFormCores(d); }
    };
    carregar();
  }, []);

  // ── Salvar configurações do servidor ─────────────────────────────────────
  const salvar = async (dados: any) => {
    setSalvando(true); setMsg('');
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
    const { error } = await supabase
      .from('configuracoes_servidor')
      .upsert({ guild_id: guildId, ...dados }, { onConflict: 'guild_id' });
    setSalvando(false);
    setMsg(error ? 'Erro ao salvar.' : 'Salvo com sucesso!');
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleArr = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const criarCargo = async (e: React.FormEvent) => {
    e.preventDefault(); setCriando(true); setMsg('');
    const res = await fetch('/api/discord/cargos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeCargo, cor: corCargo }),
    });
    setCriando(false);
    if (res.ok) {
      setMsg('Cargo criado!'); setNomeCargo('');
      const r = await fetch('/api/discord/cargos');
      if (r.ok) setCargos(await r.json());
    } else {
      setMsg('Erro ao criar cargo.');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  const salvarConfigRoll = async () => {
    if (!formRoll.cargo_id) { setMsgRoll('Selecione um cargo.'); return; }
    setSalvandoRoll(true); setMsgRoll('');
    const res = await fetch('/api/configuracoes-roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formRoll),
    });
    if (res.ok) {
      const nova = await res.json();
      setConfigsRoll(prev => {
        const sem = prev.filter((c: any) => c.cargo_id !== nova.cargo_id);
        return [...sem, nova].sort((a: any, b: any) => b.cartas_por_roll - a.cartas_por_roll);
      });
      setFormRoll({ cargo_id:'', cargo_nome:'', cooldown_valor:30, cooldown_unidade:'minutos', rolls_por_periodo:5, cartas_por_roll:1, capturas_por_dia:10, cooldown_captura_segundos:30 });
      setMsgRoll('Configuração salva!');
    } else { setMsgRoll('Erro ao salvar.'); }
    setSalvandoRoll(false);
    setTimeout(() => setMsgRoll(''), 3000);
  };

  const salvarConfigSistema = async () => {
    setSalvandoSistema(true); setMsgSistema('');
    const res = await fetch('/api/configuracoes-cartas-sistema', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configSistema),
    });
    setSalvandoSistema(false);
    setMsgSistema(res.ok ? 'Configurações salvas!' : 'Erro ao salvar.');
    setTimeout(() => setMsgSistema(''), 3000);
  };

  const deletarConfigRoll = async (id: string) => {
    if (!confirm('Remover configuração deste cargo?')) return;
    const res = await fetch(`/api/configuracoes-roll?id=${id}`, { method: 'DELETE' });
    if (res.ok) setConfigsRoll(prev => prev.filter((c: any) => c.id !== id));
  };

  const salvarCores = async () => {
    setSalvandoCores(true); setMsgCores('');
    const res = await fetch('/api/configuracoes-cores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formCores),
    });
    setSalvandoCores(false);
    setMsgCores(res.ok ? 'Configuração salva!' : 'Erro ao salvar.');
    setTimeout(() => setMsgCores(''), 3000);
  };

  const enviarEmbedCores = async () => {
    if (!formCores.canal_cores_id) { setMsgCores('Selecione um canal primeiro.'); return; }
    setEnviandoCores(true); setMsgCores('');
    const cargosObj = (ids: string[]) =>
      ids.map((id: string) => cargos.find(c => c.id === id)).filter(Boolean);
    const res = await fetch('/api/discord/enviar-embed-cores', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canalId:           formCores.canal_cores_id,
        titulo:            formCores.titulo_embed,
        cor:               formCores.cor_embed,
        cargos_solidos:    cargosObj(formCores.cargos_solidos),
        cargos_gradientes: cargosObj(formCores.cargos_gradientes),
      }),
    });
    setEnviandoCores(false);
    setMsgCores(res.ok ? 'Embed enviado!' : 'Erro ao enviar embed.');
    setTimeout(() => setMsgCores(''), 4000);
  };

  const listaCargos = cargos.filter(c => c.name !== '@everyone');

  const abas: { id: Aba; label: string; icon: React.ReactNode }[] = [
    { id: 'globais',     label: 'Globais',     icon: <Settings className="w-4 h-4" /> },
    { id: 'boasvindas',  label: 'Boas-Vindas', icon: <Heart className="w-4 h-4" /> },
    { id: 'cartas',      label: 'Cartas',      icon: <CardIcon className="w-4 h-4" /> },
    { id: 'hierarquias', label: 'Hierarquias', icon: <Trophy className="w-4 h-4" /> },
    { id: 'cargos',      label: 'Cargos',      icon: <TagIcon className="w-4 h-4" /> },
    { id: 'cores',       label: 'Cores',       icon: <Palette className="w-4 h-4" /> },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <header className="border-b border-gray-800/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Central de <span className="text-cyan-400">Comando</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">Configure o bot da NOITADA</p>
      </header>

      {/* Abas */}
      <nav className="border-b border-gray-800/60">
        <div className="flex flex-wrap gap-1">
          {abas.map(a => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${
                aba === a.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-white'
              }`}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </nav>

      {msg && <StatusMsg msg={msg} />}

      {/* ── ABA GLOBAIS ────────────────────────────────────────────────────── */}
      {aba === 'globais' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Cargos do Sistema</h3>
            {[
              { label: 'Cargo Membro (entregue após cadastro)', campo: 'cargo_membro_id' },
              { label: 'Cargo de Moderador',                   campo: 'cargo_staff_id'  },
              { label: 'Cargo Administrador',                  campo: 'cargo_admin_id'  },
            ].map(({ label, campo }) => {
              const cargoSel = listaCargos.find(c => c.id === (formGlobais as any)[campo]);
              return (
                <div key={campo}>
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">{label}</label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {[{ id: '', name: 'Nenhum', color: 0 }, ...listaCargos].map(c => (
                      <BotaoCargo
                        key={c.id} cargo={c}
                        selecionado={(formGlobais as any)[campo] === c.id}
                        onClick={() => setFormGlobais(f => ({ ...f, [campo]: c.id }))}
                      />
                    ))}
                  </div>
                  {cargoSel && (
                    <p className="text-xs mt-1.5 font-bold flex items-center gap-1" style={{ color: corHex(cargoSel.color) }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: corHex(cargoSel.color) }} />
                      {cargoSel.name}
                    </p>
                  )}
                </div>
              );
            })}
            <button onClick={() => salvar(formGlobais)} disabled={salvando}
              className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar Configurações Globais'}
            </button>
          </div>
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 lg:sticky lg:top-24">
            <PreviewGlobais form={formGlobais} cargos={cargos} />
          </div>
        </div>
      )}

      {/* ── ABA BOAS-VINDAS ────────────────────────────────────────────────── */}
      {aba === 'boasvindas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Recepção do Servidor</h3>
            <div>
              <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Canal de Boas-Vindas</label>
              <SeletorCanal
                value={formBoas.canal_boas_vindas_id}
                onChange={id => setFormBoas(f => ({ ...f, canal_boas_vindas_id: id }))}
                placeholder="Selecione o canal"
              />
            </div>
            {[
              { label: 'Título do Embed',        campo: 'titulo_boas_vindas',    placeholder: 'UM NOVO MEMBRO ATERRISSOU!' },
              { label: 'Descrição do Embed',     campo: 'descricao_boas_vindas', placeholder: 'Seja bem-vindo, @NovoMembro!' },
              { label: 'Mensagem fora do Embed', campo: 'mensagem_boas_vindas',  placeholder: 'Chega mais, @NovoMembro!' },
              { label: 'URL do Banner (opcional)',campo: 'banner_boas_vindas',   placeholder: 'https://...' },
            ].map(({ label, campo, placeholder }) => (
              <div key={campo}>
                <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">{label}</label>
                <input
                  value={(formBoas as any)[campo]}
                  onChange={e => setFormBoas(f => ({ ...f, [campo]: e.target.value }))}
                  className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition-all"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cor do Embed</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formBoas.cor_boas_vindas}
                  onChange={e => setFormBoas(f => ({ ...f, cor_boas_vindas: e.target.value }))}
                  className="w-14 h-10 rounded-lg border border-gray-700/50 bg-transparent cursor-pointer" />
                <span className="text-sm text-gray-400 font-mono">{formBoas.cor_boas_vindas}</span>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formBoas.mostrar_avatar_boas_vindas}
                onChange={e => setFormBoas(f => ({ ...f, mostrar_avatar_boas_vindas: e.target.checked }))}
                className="w-5 h-5 accent-cyan-500" />
              <span className="text-sm text-gray-300 font-bold">Mostrar avatar do usuário no embed</span>
            </label>
            <button onClick={() => salvar(formBoas)} disabled={salvando}
              className="w-full py-4 bg-pink-500 hover:bg-pink-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar Boas-Vindas'}
            </button>
          </div>
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 lg:sticky lg:top-24">
            <PreviewBoasVindas form={formBoas} />
          </div>
        </div>
      )}

      {/* ── ABA HIERARQUIAS ────────────────────────────────────────────────── */}
      {aba === 'hierarquias' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            {[
              { titulo: 'Cargos Comuns',                     sub: 'Cargos que qualquer membro pode receber',    campo: 'cargos_comuns' },
              { titulo: 'Quem pode dar Cargos Comuns',       sub: 'Quais cargos têm permissão para distribuir', campo: 'quem_pode_dar_comuns' },
              { titulo: 'Cargos de Moderação',               sub: 'Cargos com privilégios elevados',            campo: 'cargos_moderacao' },
              { titulo: 'Quem pode dar Cargos de Moderação', sub: 'Apenas estes cargos podem promover',         campo: 'quem_pode_dar_moderacao' },
            ].map(({ titulo, sub, campo }) => (
              <div key={campo} className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-5">
                <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{titulo}</h4>
                <p className="text-xs text-gray-500 mb-3">{sub}</p>
                <div className="flex flex-wrap gap-2">
                  {listaCargos.map(c => (
                    <BotaoCargo
                      key={c.id} cargo={c}
                      selecionado={((formHierarquias as any)[campo] as string[]).includes(c.id)}
                      onClick={() => setFormHierarquias(f => ({ ...f, [campo]: toggleArr((f as any)[campo], c.id) }))}
                    />
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => salvar(formHierarquias)} disabled={salvando}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar Hierarquias'}
            </button>
          </div>
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 lg:sticky lg:top-24">
            <PreviewHierarquias form={formHierarquias} cargos={cargos} />
          </div>
        </div>
      )}

      {/* ── ABA CARGOS ─────────────────────────────────────────────────────── */}
      {aba === 'cargos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Cargos do Servidor</h3>
              <div className="flex flex-wrap gap-2">
                {listaCargos.map(c => {
                  const cor = corHex(c.color);
                  return (
                    <div key={c.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border"
                      style={{ color: cor, borderColor: cor + '50', background: cor + '18' }}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cor }} />
                      {c.name}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Criar Novo Cargo</h3>
              <form onSubmit={criarCargo} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-40">
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Nome</label>
                  <input value={nomeCargo} onChange={e => setNomeCargo(e.target.value)} required
                    className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition-all"
                    placeholder="Nome do cargo" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Cor</label>
                  <input type="color" value={corCargo} onChange={e => setCorCargo(e.target.value)}
                    className="w-12 h-12 rounded-xl border border-gray-700/50 bg-transparent cursor-pointer" />
                </div>
                <button type="submit" disabled={criando}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50">
                  {criando ? '...' : 'Criar'}
                </button>
              </form>
            </div>
          </div>
          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 lg:sticky lg:top-24">
            <PreviewCargos cargos={cargos} />
          </div>
        </div>
      )}

      {/* ── ABA CARTAS ─────────────────────────────────────────────────────── */}
      {aba === 'cartas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">

            {/* Sistema Global */}
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <GlobeIcon className="w-5 h-5 text-cyan-400" /> Sistema Global de Spawn
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Intervalo entre spawns</label>
                  <div className="flex items-center gap-3">
                    <input type="number" min={1} max={1440}
                      value={configSistema.intervalo_spawn_minutos}
                      onChange={e => setConfigSistema((f: any) => ({ ...f, intervalo_spawn_minutos: parseInt(e.target.value) || 60 }))}
                      className="w-24 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                    <span className="text-gray-400 text-sm">minutos</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Canal de spawn</label>
                  <SeletorCanal
                    value={configSistema.canal_spawn_id}
                    onChange={id => setConfigSistema((f: any) => ({ ...f, canal_spawn_id: id }))}
                    placeholder="Selecione o canal"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Horário de reset diário</label>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={23} value={configSistema.reset_capturas_hora}
                    onChange={e => setConfigSistema((f: any) => ({ ...f, reset_capturas_hora: parseInt(e.target.value) || 0 }))}
                    className="w-20 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none text-center"
                  />
                  <span className="text-gray-400 font-black">h</span>
                  <span className="text-gray-400 font-black">:</span>
                  <input type="number" min={0} max={59} value={configSistema.reset_capturas_minuto}
                    onChange={e => setConfigSistema((f: any) => ({ ...f, reset_capturas_minuto: parseInt(e.target.value) || 0 }))}
                    className="w-20 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none text-center"
                  />
                  <span className="text-gray-400 font-black">min</span>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={configSistema.ativo}
                  onChange={e => setConfigSistema((f: any) => ({ ...f, ativo: e.target.checked }))}
                  className="w-5 h-5 accent-cyan-500" />
                <span className="text-sm text-gray-300 font-bold">Sistema de spawn automático ativo</span>
              </label>
              {msgSistema && <StatusMsg msg={msgSistema} />}
              <button onClick={salvarConfigSistema} disabled={salvandoSistema}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
                {salvandoSistema ? 'Salvando...' : 'Salvar Sistema'}
              </button>
            </div>

            {/* Limites por Cargo */}
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <GearIcon className="w-5 h-5 text-amber-400" /> Limites por Cargo
              </h3>
              <div>
                <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cargo</label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                  {listaCargos.map((c: any) => (
                    <BotaoCargo
                      key={c.id} cargo={c}
                      selecionado={formRoll.cargo_id === c.id}
                      onClick={() => setFormRoll((f: any) => ({ ...f, cargo_id: c.id, cargo_nome: c.name }))}
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-4 p-4 bg-gray-900/60 rounded-xl border border-gray-700/40">
                  <p className="text-xs text-cyan-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <DiceIcon className="w-3.5 h-3.5" /> Roll (/roll)
                  </p>
                  <div>
                    <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cooldown</label>
                    <div className="flex gap-2 items-center">
                      <input type="number" min={1} max={999} value={formRoll.cooldown_valor}
                        onChange={e => setFormRoll((f: any) => ({ ...f, cooldown_valor: parseInt(e.target.value) || 1 }))}
                        className="w-20 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                      />
                      {(['minutos', 'horas'] as const).map(u => (
                        <button key={u} onClick={() => setFormRoll((f: any) => ({ ...f, cooldown_unidade: u }))}
                          className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all border ${
                            formRoll.cooldown_unidade === u
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-gray-900/60 border-gray-700/50 text-gray-400'
                          }`}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Rolls por período</label>
                    <input type="number" min={1} max={999} value={formRoll.rolls_por_periodo}
                      onChange={e => setFormRoll((f: any) => ({ ...f, rolls_por_periodo: parseInt(e.target.value) || 1 }))}
                      className="w-20 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cartas por roll</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setFormRoll((f: any) => ({ ...f, cartas_por_roll: n }))}
                          className={`w-10 h-10 rounded-xl text-sm font-black transition-all border ${
                            formRoll.cartas_por_roll === n
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                              : 'bg-gray-900/60 border-gray-700/50 text-gray-400'
                          }`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4 p-4 bg-gray-900/60 rounded-xl border border-gray-700/40">
                  <p className="text-xs text-green-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <CardIcon className="w-3.5 h-3.5" /> Captura
                  </p>
                  <div>
                    <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Capturas por dia</label>
                    <input type="number" min={1} max={999} value={formRoll.capturas_por_dia}
                      onChange={e => setFormRoll((f: any) => ({ ...f, capturas_por_dia: parseInt(e.target.value) || 10 }))}
                      className="w-20 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cooldown entre capturas (s)</label>
                    <input type="number" min={0} max={3600} value={formRoll.cooldown_captura_segundos}
                      onChange={e => setFormRoll((f: any) => ({ ...f, cooldown_captura_segundos: parseInt(e.target.value) || 0 }))}
                      className="w-20 bg-gray-900/60 border border-gray-700/50 rounded-xl px-3 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                  </div>
                </div>
              </div>
              {msgRoll && <StatusMsg msg={msgRoll} />}
              <button onClick={salvarConfigRoll} disabled={salvandoRoll}
                className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
                {salvandoRoll ? 'Salvando...' : 'Salvar Configuração do Cargo'}
              </button>
            </div>

            {/* Configurações salvas */}
            {configsRoll.length > 0 && (
              <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-3">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-gray-400" /> Configurações por Cargo
                </h3>
                {configsRoll.map((config: any) => (
                  <div key={config.id} className="flex items-start justify-between p-4 bg-gray-800/30 border border-gray-700/40 rounded-xl gap-4">
                    <div className="space-y-1 flex-1">
                      <p className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-1.5">
                        <TagIcon className="w-3.5 h-3.5 text-gray-400" /> {config.cargo_nome}
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><TimerIcon className="w-3 h-3" /> Cooldown: <span className="text-cyan-400 font-bold ml-1">{config.cooldown_valor} {config.cooldown_unidade}</span></span>
                        <span className="flex items-center gap-1"><CardIcon className="w-3 h-3" /> Capturas/dia: <span className="text-green-400 font-bold ml-1">{config.capturas_por_dia}</span></span>
                        <span className="flex items-center gap-1"><DiceIcon className="w-3 h-3" /> Rolls/período: <span className="text-cyan-400 font-bold ml-1">{config.rolls_por_periodo}</span></span>
                        <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> CD captura: <span className="text-green-400 font-bold ml-1">{config.cooldown_captura_segundos}s</span></span>
                        <span className="flex items-center gap-1"><BoxIcon className="w-3 h-3" /> Cartas/roll: <span className="text-cyan-400 font-bold ml-1">{config.cartas_por_roll}</span></span>
                      </div>
                    </div>
                    <button onClick={() => deletarConfigRoll(config.id)}
                      className="px-3 py-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 rounded-xl text-red-400 text-xs font-black transition-all shrink-0">
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 lg:sticky lg:top-24">
            <PreviewCartas configSistema={configSistema} configsRoll={configsRoll} />
          </div>
        </div>
      )}

      {/* ── ABA CORES ──────────────────────────────────────────────────────── */}
      {aba === 'cores' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-5">
            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Palette className="w-5 h-5 text-pink-400" /> Embed de Cores
              </h3>
              <div>
                <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Canal para enviar</label>
                <SeletorCanal
                  value={formCores.canal_cores_id}
                  onChange={id => setFormCores((f: any) => ({ ...f, canal_cores_id: id }))}
                  placeholder="Selecione o canal"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Título do Embed</label>
                  <input
                    value={formCores.titulo_embed}
                    onChange={e => setFormCores((f: any) => ({ ...f, titulo_embed: e.target.value }))}
                    className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition-all"
                    placeholder="🎨 Cargos de Cor"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cor da borda</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={formCores.cor_embed}
                      onChange={e => setFormCores((f: any) => ({ ...f, cor_embed: e.target.value }))}
                      className="w-14 h-11 rounded-lg border border-gray-700/50 bg-transparent cursor-pointer" />
                    <span className="text-sm text-gray-400 font-mono">{formCores.cor_embed}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">🎨 Cores Sólidas</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Cargos com cor única sólida</p>
                </div>
                <span className="text-xs font-bold text-pink-400 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20">
                  {formCores.cargos_solidos?.length ?? 0} selecionados
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {listaCargos.map(c => (
                  <BotaoCargo
                    key={c.id} cargo={c}
                    selecionado={(formCores.cargos_solidos || []).includes(c.id)}
                    onClick={() => setFormCores((f: any) => ({
                      ...f,
                      cargos_solidos: toggleArr(f.cargos_solidos || [], c.id),
                      cargos_gradientes: (f.cargos_gradientes || []).filter((id: string) => id !== c.id),
                    }))}
                  />
                ))}
              </div>
            </div>

            <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">✨ Gradientes</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Cargos com cores em gradiente</p>
                </div>
                <span className="text-xs font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-lg border border-violet-500/20">
                  {formCores.cargos_gradientes?.length ?? 0} selecionados
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                {listaCargos.map(c => (
                  <BotaoCargo
                    key={c.id} cargo={c}
                    selecionado={(formCores.cargos_gradientes || []).includes(c.id)}
                    onClick={() => setFormCores((f: any) => ({
                      ...f,
                      cargos_gradientes: toggleArr(f.cargos_gradientes || [], c.id),
                      cargos_solidos: (f.cargos_solidos || []).filter((id: string) => id !== c.id),
                    }))}
                  />
                ))}
              </div>
            </div>

            {msgCores && <StatusMsg msg={msgCores} />}

            <div className="flex gap-3">
              <button onClick={salvarCores} disabled={salvandoCores}
                className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
                {salvandoCores ? 'Salvando...' : 'Salvar Configuração'}
              </button>
              <button onClick={enviarEmbedCores} disabled={enviandoCores || !formCores.canal_cores_id}
                className="flex-1 py-4 bg-pink-500 hover:bg-pink-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
                {enviandoCores ? 'Enviando...' : '📤 Enviar Embed'}
              </button>
            </div>
          </div>

          <div className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 lg:sticky lg:top-24">
            <PreviewCores form={formCores} cargos={cargos} />
          </div>
        </div>
      )}
    </div>
  );
}
