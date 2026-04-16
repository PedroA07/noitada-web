"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Home, Settings, Users, User, LogOut } from 'lucide-react';
import { CardIcon, LogoIcon, LoadingSpinner } from '@/lib/icons';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataAtual, setDataAtual] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { nome: 'Início',    rota: '/dashboard',         icone: <Home className="w-5 h-5" /> },
    { nome: 'Sistemas',  rota: '/dashboard/bot',      icone: <Settings className="w-5 h-5" /> },
    { nome: 'Membros',   rota: '/dashboard/membros',  icone: <Users className="w-5 h-5" /> },
    { nome: 'Cartas',    rota: '/dashboard/cartas',   icone: <CardIcon className="w-5 h-5" /> },
    { nome: 'Perfil',    rota: '/dashboard/perfil',   icone: <User className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const carregar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).maybeSingle();
      setPerfil(perfilData || {
        nome: session.user.user_metadata?.full_name || 'Usuário',
        avatar_url: session.user.user_metadata?.avatar_url || '',
      });
      setLoading(false);
    };
    carregar();
  }, [router]);

  useEffect(() => {
    const atualizarDataHora = () => {
      const agora = new Date();
      const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
      setDiaSemana(diasSemana[agora.getDay()]);
      setDataAtual(agora.toLocaleDateString('pt-BR'));
      setHoraAtual(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    atualizarDataHora();
    const intervalo = setInterval(atualizarDataHora, 1000);
    return () => clearInterval(intervalo);
  }, []);

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <LogoIcon className="w-12 h-12 text-cyan-400" />
        <LoadingSpinner className="w-8 h-8 text-cyan-500" />
        <span className="text-gray-500 font-mono text-sm tracking-widest uppercase">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white relative overflow-hidden">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60 flex items-center justify-between px-6 font-mono">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <LogoIcon className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            <span className="font-black text-lg tracking-widest text-white uppercase group-hover:text-cyan-300 transition-colors">NOITADA</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-sm bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-1.5">
            <span className="text-gray-400">{diaSemana}</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-300">{dataAtual}</span>
            <span className="text-gray-600">·</span>
            <span className="text-cyan-400 font-semibold">{horaAtual}</span>
          </div>
          {perfil?.avatar_url && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-700/60 ring-1 ring-cyan-500/20">
              <Image src={perfil.avatar_url} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <span className="text-sm text-gray-400 hidden sm:block">{perfil?.nome}</span>
          <button
            onClick={handleSair}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40 hover:bg-red-500/30 border border-red-700/40 hover:border-red-500/60 rounded-lg transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs font-bold hidden sm:block">Sair</span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-16 left-0 h-full w-60 bg-gray-950/95 backdrop-blur-xl border-r border-gray-800/60 z-30 transition-transform duration-300 font-mono ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex flex-col gap-1 p-4 pt-6">
          {links.map((link) => {
            const ativo = pathname === link.rota;
            return (
              <Link
                key={link.nome}
                href={link.rota}
                onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  ativo
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                <span className={ativo ? 'text-cyan-400' : 'text-gray-500'}>{link.icone}</span>
                {link.nome}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-20 left-0 right-0 px-4">
          <div className="border-t border-gray-800/60 pt-4 space-y-2">
            {perfil?.avatar_url && (
              <div className="flex items-center gap-3 px-3">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-700/60 shrink-0">
                  <Image src={perfil.avatar_url} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{perfil?.nome}</p>
                  <p className="text-xs text-gray-500 truncate">{perfil?.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {menuAberto && (
        <div className="fixed inset-0 bg-black/60 z-20 backdrop-blur-sm" onClick={() => setMenuAberto(false)} />
      )}

      {/* Main content */}
      <main className="pt-16 min-h-screen relative z-10">
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
