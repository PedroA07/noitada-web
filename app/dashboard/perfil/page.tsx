"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { CalendarPicker, DropdownPicker } from '@/lib/components';
import { MemberIcon, StatusMsg } from '@/lib/icons';

export default function PerfilPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const carregar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('perfis').select('*').eq('id', session.user.id).maybeSingle();
      if (data) { setPerfil(data); setNome(data.nome || ''); setGenero(data.genero || ''); setNascimento(data.nascimento || ''); }
    };
    carregar();
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault(); setSalvando(true); setMsg('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase.from('perfis').update({ nome, genero, nascimento: nascimento || null }).eq('id', session.user.id);
    setSalvando(false);
    setMsg(error ? 'Erro ao salvar.' : 'Perfil atualizado!');
    if (!error) setPerfil((p: any) => ({ ...p, nome, genero, nascimento }));
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="border-b border-gray-800/60 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">
          Meu <span className="text-cyan-400">Perfil</span>
        </h1>
      </header>

      {perfil && (
        <div className="flex items-center gap-6 bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6">
          {perfil.avatar_url ? (
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-cyan-500 shrink-0">
              <Image src={perfil.avatar_url} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 border-2 border-cyan-500/50 flex items-center justify-center shrink-0">
              <MemberIcon className="w-8 h-8 text-cyan-400" />
            </div>
          )}
          <div>
            <p className="text-2xl font-black text-white">{perfil.nome}</p>
            <p className="text-xs text-cyan-400 font-black uppercase tracking-widest mt-1">Membro Oficial</p>
            <p className="text-xs text-gray-500 mt-1">{perfil.email}</p>
          </div>
        </div>
      )}

      <form onSubmit={salvar} className="bg-gray-900/40 border border-gray-700/50 rounded-2xl p-6 space-y-5">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Editar Informações</h2>
        <div>
          <label className="block text-xs text-gray-400 font-black uppercase tracking-widest mb-1">Nome de Exibição</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm focus:border-cyan-500 outline-none transition-all" placeholder="Seu nome" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DropdownPicker
            value={genero}
            onChange={setGenero}
            label="Gênero"
            placeholder="Selecione seu gênero"
            options={[
              { value: '', label: 'Não informado' },
              { value: 'masculino', label: 'Masculino' },
              { value: 'feminino', label: 'Feminino' },
              { value: 'nao_informar', label: 'Prefiro não informar' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
          <CalendarPicker
            value={nascimento}
            onChange={setNascimento}
            label="Data de Nascimento"
            placeholder="Selecione a data"
          />
        </div>
        {msg && <StatusMsg msg={msg} />}
        <button type="submit" disabled={salvando}
          className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-50">
          {salvando ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}