"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Settings, Users, User } from 'lucide-react';
import { CardIcon, LogoIcon, GlobeIcon, StarIcon } from '@/lib/icons';

type Stats = {
  totalCartas: number;
  totalMembros: number;
  cartasAtivas: number;
};

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ totalCartas: 0, totalMembros: 0, cartasAtivas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: p } = await supabase.from('perfis').select('*').eq('id', session.user.id).maybeSingle();
      setPerfil(p || { nome: session.user.user_metadata?.full_name || 'Usuário' });

      const [cartasRes, membrosRes] = await Promise.all([
        supabase.from('cartas').select('id', { count: 'exact' }).eq('ativa', true),
        supabase.from('perfis').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalCartas: cartasRes.count ?? 0,
        cartasAtivas: cartasRes.count ?? 0,
        totalMembros: membrosRes.count ?? 0,
      });

      setLoading(false);
    };
    carregar();
  }, []);

  const atalhos = [
    {
      titulo: 'Cartas',
      descricao: 'Gerencie o catálogo de cartas colecionáveis',
      href: '/dashboard/cartas',
      icone: <CardIcon className="w-7 h-7" />,
      cor: 'text-cyan-400',
      borda: 'hover:border-cyan-500/50 hover:bg-cyan-500/5',
    },
    {
      titulo: 'Membros',
      descricao: 'Veja e gerencie os membros do servidor',
      href: '/dashboard/membros',
      icone: <Users className="w-7 h-7" />,
      cor: 'text-violet-400',
      borda: 'hover:border-violet-500/50 hover:bg-violet-500/5',
    },
    {
      titulo: 'Sistemas',
      descricao: 'Configure o bot e os sistemas do servidor',
      href: '/dashboard/bot',
      icone: <Settings className="w-7 h-7" />,
      cor: 'text-amber-400',
      borda: 'hover:border-amber-500/50 hover:bg-amber-500/5',
    },
    {
      titulo: 'Perfil',
      descricao: 'Edite suas informações pessoais',
      href: '/dashboard/perfil',
      icone: <User className="w-7 h-7" />,
      cor: 'text-emerald-400',
      borda: 'hover:border-emerald-500/50 hover:bg-emerald-500/5',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10">

      {/* Welcome */}
      <div className="flex items-start gap-5">
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
          <LogoIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Bem-vindo{loading ? '' : `, ${perfil?.nome?.split(' ')[0] ?? 'Usuário'}`}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Painel de controle da NOITADA</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-cyan-500/10 rounded-xl">
            <CardIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {loading ? <span className="animate-pulse text-gray-600">—</span> : stats.totalCartas}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cartas ativas</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-violet-500/10 rounded-xl">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {loading ? <span className="animate-pulse text-gray-600">—</span> : stats.totalMembros}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Membros</p>
          </div>
        </div>

        <div className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <GlobeIcon className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">Online</p>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Status</p>
          </div>
        </div>
      </div>

      {/* Quick access */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <StarIcon className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Acesso Rápido</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {atalhos.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`group flex items-center gap-4 p-5 bg-gray-900/40 border border-gray-700/50 rounded-2xl transition-all ${a.borda}`}
            >
              <div className={`shrink-0 ${a.cor} transition-transform group-hover:scale-110`}>
                {a.icone}
              </div>
              <div>
                <p className={`font-black text-sm uppercase tracking-widest ${a.cor}`}>{a.titulo}</p>
                <p className="text-xs text-gray-500 mt-0.5">{a.descricao}</p>
              </div>
              <svg className="w-4 h-4 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
