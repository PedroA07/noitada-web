"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Aba = 'globais' | 'boasvindas' | 'hierarquias' | 'cargos';

export default function BotPage() {
  const [aba, setAba] = useState<Aba>('globais');
  const [cargos, setCargos] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [nomeCargo, setNomeCargo] = useState('');
  const [corCargo, setCorCargo] = useState('#9333ea');
  const [criando, setCriando] = useState(false);

  const [formGlobais, setFormGlobais] = useState({ cargo_membro_id: '', cargo_staff_id: '', cargo_admin_id: '' });
  const [formBoas, setFormBoas] = useState({
    canal_boas_vindas_id: '', titulo_boas_vindas: '', descricao_boas_vindas: '',
    mensagem_boas_vindas: '', cor_boas_vindas: '#EC4899', banner_boas_vindas: '', mostrar_avatar_boas_vindas: true,
  });
  const [formHierarquias, setFormHierarquias] = useState({
    cargos_comuns: [] as string[], quem_pode_dar_comuns: [] as string[],
    cargos_moderacao: [] as string[], quem_pode_dar_moderacao: [] as string[],
  });

  useEffect(() => {
    const carregar = async () => {
      const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setIsAdmin(true);
      const { data: cfg } = await supabase.from('configuracoes_servidor').select('*').eq('guild_id', guildId).maybeSingle();
      if (cfg) {
        setFormGlobais({ cargo_membro_id: cfg.cargo_membro_id || '', cargo_staff_id: cfg.cargo_staff_id || '', cargo_admin_id: cfg.cargo_admin_id || '' });
        setFormBoas({ canal_boas_vindas_id: cfg.canal_boas_vindas_id || '', titulo_boas_vindas: cfg.titulo_boas_vindas || '', descricao_boas_vindas: cfg.descricao_boas_vindas || '', mensagem_boas_vindas: cfg.mensagem_boas_vindas || '', cor_boas_vindas: cfg.cor_boas_vindas || '#EC4899', banner_boas_vindas: cfg.banner_boas_vindas || '', mostrar_avatar_boas_vindas: cfg.mostrar_avatar_boas_vindas !== false });
        setFormHierarquias({ cargos_comuns: cfg.cargos_comuns || [], quem_pode_dar_comuns: cfg.quem_pode_dar_comuns || [], cargos_moderacao: cfg.cargos_moderacao || [], quem_pode_dar_moderacao: cfg.quem_pode_dar_moderacao || [] });
      }
      const resCargos = await fetch('/api/discord/cargos');
      if (resCargos.ok) setCargos(await resCargos.json());
    };
    carregar();
  }, []);

  const salvar = async (dados: any) => {
    setSalvando(true); setMsg('');
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;
    const { error } = await supabase.from('configuracoes_servidor').upsert({ guild_id: guildId, ...dados }, { onConflict: 'guild_id' });
    setSalvando(false);
    setMsg(error ? '❌ Erro ao salvar.' : '✅ Salvo com sucesso!');
    setTimeout(() => setMsg(''), 3000);
  };

  const toggleArr = (arr: string[], id: string) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const criarCargo = async (e: React.FormEvent) => {
    e.preventDefault(); setCriando(true); setMsg('');
    const res = await fetch('/api/discord/cargos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: nomeCargo, cor: corCargo }),
    });
    setCriando(false);
    if (res.ok) { setMsg('✅ Cargo criado!'); setNomeCargo(''); const r = await fetch('/api/discord/cargos'); if (r.ok) setCargos(await r.json()); }
    else setMsg('❌ Erro ao criar cargo.');
    setTimeout(() => setMsg(''), 3000);
  };

  const abas: { id: Aba; label: string }[] = [
    { id: 'globais', label: '⚙️ Globais' }, { id: 'boasvindas', label: '👋 Boas-Vindas' },
    { id: 'hierarquias', label: '🏆 Hierarquias' }, { id: 'cargos', label: '🏷️ Cargos' },
  ];

  const listaCargos = cargos.filter(c => c.name !== '@everyone');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="border-b border-white/10 pb-6">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
          Central de <span className="text-fuchsia-400">Comando</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Configure o bot da NOITADA</p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${aba === a.id ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
            {a.label}
          </button>
        ))}
      </div>

      {msg && <p className="text-sm font-bold px-1">{msg}</p>}

      {aba === 'globais' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Cargos do Sistema</h3>
          {[
            { label: 'Cargo Membro (entregue após cadastro)', campo: 'cargo_membro_id' },
            { label: 'Cargo Staff', campo: 'cargo_staff_id' },
            { label: 'Cargo Admin', campo: 'cargo_admin_id' },
          ].map(({ label, campo }) => (
            <div key={campo}>
              <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">{label}</p>
              <div className="flex flex-wrap gap-2">
                {listaCargos.map(c => (
                  <button key={c.id} onClick={() => setFormGlobais(f => ({ ...f, [campo]: c.id }))}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${(formGlobais as any)[campo] === c.id ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'}`}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => salvar(formGlobais)} disabled={salvando}
            className="w-full py-4 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar Configurações Globais'}
          </button>
        </div>
      )}

      {aba === 'boasvindas' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Recepção do Servidor</h3>
          <p className="text-xs text-gray-400">Use <code className="bg-white/10 px-1 rounded">@NovoMembro</code> para mencionar o usuário.</p>
          {[
            { label: 'ID do Canal de Boas-Vindas', campo: 'canal_boas_vindas_id', placeholder: 'Ex: 123456789012345678' },
            { label: 'Título do Embed', campo: 'titulo_boas_vindas', placeholder: '🦉 UM NOVO MEMBRO ATERRISSOU!' },
            { label: 'Descrição do Embed', campo: 'descricao_boas_vindas', placeholder: 'Seja bem-vindo, @NovoMembro!' },
            { label: 'Mensagem fora do Embed', campo: 'mensagem_boas_vindas', placeholder: 'Chega mais, @NovoMembro! 🎉' },
            { label: 'URL do Banner (opcional)', campo: 'banner_boas_vindas', placeholder: 'https://...' },
          ].map(({ label, campo, placeholder }) => (
            <div key={campo}>
              <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">{label}</label>
              <input value={(formBoas as any)[campo]} onChange={e => setFormBoas(f => ({ ...f, [campo]: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none transition-all"
                placeholder={placeholder} />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-2">Cor do Embed</label>
            <div className="flex items-center gap-3">
              <input type="color" value={formBoas.cor_boas_vindas} onChange={e => setFormBoas(f => ({ ...f, cor_boas_vindas: e.target.value }))}
                className="w-14 h-10 rounded-lg border border-white/10 bg-transparent cursor-pointer" />
              <span className="text-sm text-gray-400">{formBoas.cor_boas_vindas}</span>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={formBoas.mostrar_avatar_boas_vindas} onChange={e => setFormBoas(f => ({ ...f, mostrar_avatar_boas_vindas: e.target.checked }))} className="w-5 h-5 accent-fuchsia-500" />
            <span className="text-sm text-gray-300 font-bold">Mostrar avatar do usuário no embed</span>
          </label>
          <button onClick={() => salvar(formBoas)} disabled={salvando}
            className="w-full py-4 bg-pink-500 hover:bg-pink-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar Boas-Vindas'}
          </button>
        </div>
      )}

      {aba === 'hierarquias' && (
        <div className="space-y-4">
          {[
            { titulo: 'Cargos Comuns', sub: 'Cargos que qualquer membro pode receber', campo: 'cargos_comuns' },
            { titulo: 'Quem pode dar Cargos Comuns', sub: 'Quais cargos têm permissão para distribuir', campo: 'quem_pode_dar_comuns' },
            { titulo: 'Cargos de Moderação', sub: 'Cargos com privilégios elevados', campo: 'cargos_moderacao' },
            { titulo: 'Quem pode dar Cargos de Moderação', sub: 'Apenas estes cargos podem promover', campo: 'quem_pode_dar_moderacao' },
          ].map(({ titulo, sub, campo }) => (
            <div key={campo} className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">{titulo}</h4>
              <p className="text-xs text-gray-500 mb-3">{sub}</p>
              <div className="flex flex-wrap gap-2">
                {listaCargos.map(c => {
                  const arr = (formHierarquias as any)[campo] as string[];
                  const sel = arr.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => setFormHierarquias(f => ({ ...f, [campo]: toggleArr((f as any)[campo], c.id) }))}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${sel ? 'bg-fuchsia-500 text-white border-fuchsia-400' : 'bg-black/40 border-white/10 text-gray-300 hover:border-white/30'}`}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={() => salvar(formHierarquias)} disabled={salvando}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl uppercase tracking-widest text-sm transition-all disabled:opacity-50">
            {salvando ? 'Salvando...' : 'Salvar Hierarquias'}
          </button>
        </div>
      )}

      {aba === 'cargos' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Cargos do Servidor</h3>
            <div className="flex flex-wrap gap-2">
              {listaCargos.map(c => (
                <div key={c.id} className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-black text-gray-300 uppercase">{c.name}</div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Criar Novo Cargo</h3>
            <form onSubmit={criarCargo} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Nome</label>
                <input value={nomeCargo} onChange={e => setNomeCargo(e.target.value)} required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-fuchsia-500 outline-none transition-all"
                  placeholder="Nome do cargo" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Cor</label>
                <input type="color" value={corCargo} onChange={e => setCorCargo(e.target.value)} className="w-12 h-12 rounded-xl border border-white/10 bg-transparent cursor-pointer" />
              </div>
              <button type="submit" disabled={criando}
                className="px-6 py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase text-xs tracking-widest transition-all disabled:opacity-50">
                {criando ? '...' : 'Criar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}