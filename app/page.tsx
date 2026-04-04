"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.push('/dashboard');
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/background.mp4"
      />
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div className="absolute top-4 left-4 z-20">
        <img src="/images/logo.png" alt="NOITADA Logo" className="h-12 w-auto" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-20 text-center space-y-8 max-w-2xl">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 tracking-widest uppercase">
          NOITADA
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          A comunidade definitiva para gamers e corujas da madrugada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/cadastro" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(168,85,247,0.4)] active:scale-95">
            Criar Conta
          </Link>
          <Link href="/login" className="px-8 py-4 bg-white/5 border border-white/20 hover:bg-white/10 text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm active:scale-95">
            Entrar
          </Link>
        </div>
        <div className="mt-12 flex justify-center">
          <div className="bg-gray-900/80 border border-white/20 backdrop-blur-md rounded-2xl p-4 shadow-2xl">
            <iframe
              src={`https://discord.com/widget?id=${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}&theme=dark`}
              width="350"
              height="500"
              allowTransparency={true}
              frameBorder="0"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              className="rounded-xl"
            ></iframe>
          </div>
        </div>
      </div>
    </main>
  );
}