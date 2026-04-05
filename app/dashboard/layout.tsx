"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Home, Settings, Users, User, LogOut } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dataAtual, setDataAtual] = useState('');
  const [diaSemana, setDiaSemana] = useState('');
  const [horaAtual, setHoraAtual] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { nome: 'Início', rota: '/dashboard', icone: <Home className="w-5 h-5" /> },
    { nome: 'Sistemas', rota: '/dashboard/bot', icone: <Settings className="w-5 h-5" /> },
    { nome: 'Membros', rota: '/dashboard/membros', icone: <Users className="w-5 h-5" /> },
    { nome: 'Perfil', rota: '/dashboard/perfil', icone: <User className="w-5 h-5" /> },
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
      <div className="min-h-screen bg-purple-900 flex items-center justify-center">
        <div className="text-purple-300 font-mono font-black text-xl animate-pulse">🦉 Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-black text-white relative overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950/85 backdrop-blur-xl border-b border-purple-400/30 shadow-lg shadow-purple-500/20 flex items-center justify-between px-6 font-mono">
        <div className="flex items-center gap-4">
          <button onClick={() => setMenuAberto(!menuAberto)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="font-black text-xl tracking-widest text-fuchsia-400 uppercase">NOITADA</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm bg-purple-800/50 border border-purple-400/30 rounded-lg px-3 py-1 backdrop-blur-sm">
            <span className="text-purple-200">{diaSemana}</span>
            <span className="text-purple-300">•</span>
            <span className="text-purple-200">{dataAtual}</span>
            <span className="text-purple-300">•</span>
            <span className="text-purple-100 font-semibold">{horaAtual}</span>
          </div>
          {perfil?.avatar_url && (
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
              <Image src={perfil.avatar_url} alt="avatar" fill className="object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
          <span className="text-sm text-gray-400 hidden sm:block">{perfil?.nome}</span>
          <button onClick={handleSair} className="bg-red-600/80 hover:bg-red-500 border border-red-400/50 rounded-lg p-2 transition-colors">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      <aside className={`fixed top-16 left-0 h-full w-64 bg-gradient-to-b from-purple-900 via-purple-950 to-purple-900/60 backdrop-blur-xl border-r border-purple-400/30 shadow-lg shadow-purple-500/20 z-30 transition-transform duration-300 font-mono ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="flex flex-col gap-2 p-6 pt-8">
          {links.map((link) => {
            const ativo = pathname === link.rota;
            return (
              <Link key={link.nome} href={link.rota} onClick={() => setMenuAberto(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${ativo ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'text-purple-200 hover:text-white hover:bg-purple-800/30'}`}>
                {link.icone}{link.nome}
              </Link>
            );
          })}
        </nav>
      </aside>

      {menuAberto && <div className="fixed inset-0 bg-purple-900/60 z-20" onClick={() => setMenuAberto(false)} />}

      <main className={`pt-16 min-h-screen relative z-20 ${menuAberto ? 'lg:pl-64' : ''}`}>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}