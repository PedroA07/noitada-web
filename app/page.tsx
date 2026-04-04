"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DiscordMember {
  username: string;
  status: string;
  avatar_url: string;
}

interface DiscordWidget {
  name: string;
  instant_invite: string;
  presence_count: number;
  members: DiscordMember[];
}

export default function Home() {
  const router = useRouter();
  const [widgetData, setWidgetData] = useState<DiscordWidget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWidget = async () => {
      try {
        const response = await fetch(`https://discord.com/api/guilds/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}/widget.json`);
        if (response.ok) {
          const data = await response.json();
          setWidgetData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do Discord:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWidget();
  }, []);

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
          <div className="bg-gray-900/90 border border-purple-500/30 backdrop-blur-md rounded-2xl p-4 shadow-2xl max-w-sm w-full">
            <div className="text-center mb-3">
              <h3 className="text-sm font-black text-fuchsia-400 tracking-widest uppercase">Discord Online</h3>
            </div>
            {loading ? (
              <div className="text-center text-gray-400 text-sm">Carregando...</div>
            ) : widgetData ? (
              <div className="space-y-3">
                <div className="text-center text-xs text-gray-400">
                  {widgetData.presence_count} membros online
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {widgetData.members.slice(0, 8).map((member, index) => (
                    <div key={index} className="flex items-center gap-2 p-1 bg-black/30 rounded">
                      <img
                        src={member.avatar_url || '/images/default-avatar.png'}
                        alt={member.username}
                        className="w-6 h-6 rounded-full border border-purple-500/50"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{member.username}</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'online' ? 'bg-green-400' :
                        member.status === 'idle' ? 'bg-yellow-400' :
                        member.status === 'dnd' ? 'bg-red-400' : 'bg-gray-400'
                      }`} />
                    </div>
                  ))}
                </div>
                <a
                  href={widgetData.instant_invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-bold rounded-lg transition-all uppercase tracking-wider text-xs shadow-[0_0_20px_rgba(168,85,247,0.3)] active:scale-95 py-2 text-center"
                >
                  Entrar
                </a>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm">Erro ao carregar</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}