"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface DiscordMember {
  username: string;
  status: string;
  avatar_url: string;
  game?: {
    name: string;
    details?: string;
    state?: string;
  };
}

interface DiscordWidget {
  name: string;
  instant_invite: string;
  presence_count: number;
  members: DiscordMember[];
}

const gameIcons: Record<string, { appId: string; icon: string }> = {
  'League of Legends': { appId: '401518684763586560', icon: 'dd4cfc1c4c6c4c6c4c6c4c6c4c6c4c6c' },
  'Valorant': { appId: '700136079562375258', icon: 'a7c2b5c4d4e4f5g6h7i8j9k0l1m2n3o4p5' },
  'Fortnite': { appId: '432980957394370572', icon: 'b8c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0' },
  'Among Us': { appId: '477175586805252107', icon: 'c3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8' },
  'Minecraft': { appId: '356875570916753438', icon: 'f6b7b8c4b0b8b0b8b0b8b0b8b0b8b0b8' },
  'Genshin Impact': { appId: '758008694955579443', icon: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9' },
  'Apex Legends': { appId: '766640112845987840', icon: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0' },
  'Rocket League': { appId: '252670224', icon: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6' },
  'Counter-Strike: Global Offensive': { appId: '730', icon: 'b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0' },
  'Dota 2': { appId: '570', icon: 'c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1' },
  'Overwatch 2': { appId: '2399807290', icon: 'd7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2' },
  'The Witcher 3: Wild Hunt': { appId: '292030', icon: 'e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3' },
  'Cyberpunk 2077': { appId: '1091500', icon: 'f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4' },
  'Assassin\'s Creed Valhalla': { appId: '2208920', icon: 'a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5' },
  'FIFA 23': { appId: '1811260', icon: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6' },
  'Call of Duty: Modern Warfare II': { appId: '1938090', icon: 'c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7' },
  'Grand Theft Auto V': { appId: '271590', icon: 'd3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8' },
  'The Sims 4': { appId: '1222670', icon: 'e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9' },
  'World of Warcraft': { appId: 'wow', icon: 'f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0' },
  'Spotify': { appId: 'spotify:1', icon: '1db9544e37c83a2d4e29e4b3e2e8a8c3' },
};

export default function Home() {
  const router = useRouter();
  const [widgetData, setWidgetData] = useState<DiscordWidget | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    const fetchWidget = async () => {
      try {
        const response = await fetch(`https://discord.com/api/guilds/${process.env.NEXT_PUBLIC_DISCORD_GUILD_ID}/widget.json`);
        if (response.ok) {
          const data = await response.json();
          setWidgetData(data);
          // Estimativa de total de membros (pode ser ajustado com endpoint autenticado)
          setTotalMembers(Math.max(data.presence_count * 3, 100));
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-400';
      case 'idle': return 'bg-yellow-400';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'online': return 'Online';
      case 'idle': return 'Ausente';
      case 'dnd': return 'Ocupado';
      default: return 'Offline';
    }
  };

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
      <div className="relative z-20 text-center space-y-8 max-w-3xl">
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
        <style>{`
          .discord-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .discord-scroll::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
          }
          .discord-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #a855f7, #ec4899);
            border-radius: 10px;
          }
          .discord-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #9333ea, #db2777);
          }
        `}</style>
        <div className="mt-12 flex justify-center">
          <div className="bg-gradient-to-b from-gray-900/95 to-black/95 border border-purple-500/40 backdrop-blur-md rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50 border-b border-purple-500/30 p-4">
              <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-fuchsia-300 tracking-widest uppercase mb-3">Comunidade Online</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-black/40 rounded-lg p-2 border border-green-500/20">
                  <p className="text-green-400 font-bold">{widgetData?.presence_count || 0}</p>
                  <p className="text-gray-400 text-xs">Online Agora</p>
                </div>
                <div className="bg-black/40 rounded-lg p-2 border border-purple-500/20">
                  <p className="text-purple-300 font-bold">{totalMembers}</p>
                  <p className="text-gray-400 text-xs">Total de Membros</p>
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="p-6 text-center text-gray-400">Carregando membros...</div>
            ) : widgetData && widgetData.members.length > 0 ? (
              <div className="discord-scroll max-h-96 overflow-y-auto p-4 space-y-2">
                {widgetData.members.map((member, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 p-3 bg-black/50 hover:bg-black/70 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-all group">
                    {/* Left side: Avatar and Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar com Status */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={member.avatar_url || '/images/default-avatar.png'}
                          alt={member.username}
                          className="w-10 h-10 rounded-full border-2 border-purple-500/50 group-hover:border-fuchsia-500/70 transition-all"
                        />
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${getStatusColor(member.status)} border-2 border-black`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-white truncate">{member.username}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            member.status === 'online' ? 'bg-green-500/20 text-green-300' :
                            member.status === 'idle' ? 'bg-yellow-500/20 text-yellow-300' :
                            member.status === 'dnd' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {getStatusLabel(member.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Activity */}
                    <p className="text-xs text-gray-400 truncate text-right flex items-center justify-end gap-1">
                      {member.game?.name ? (
                        member.game.name === 'Spotify' ? (
                          <>
                            <img
                              src={`https://cdn.discordapp.com/app-icons/${gameIcons['Spotify'].appId}/${gameIcons['Spotify'].icon}.png`}
                              alt="Spotify icon"
                              className="w-4 h-4"
                            />
                            <span>
                              {member.game.details && member.game.state
                                ? `${member.game.details} - ${member.game.state}`
                                : 'Ouvindo música no Spotify'}
                            </span>
                          </>
                        ) : gameIcons[member.game.name] ? (
                          <>
                            <img
                              src={`https://cdn.discordapp.com/app-icons/${gameIcons[member.game.name].appId}/${gameIcons[member.game.name].icon}.png`}
                              alt="game icon"
                              className="w-4 h-4"
                            />
                            <span>{member.game.name}</span>
                          </>
                        ) : (
                          <>
                            <span>🎮</span>
                            <span>{member.game.name}</span>
                          </>
                        )
                      ) : (
                        '• Inativo'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400">Nenhum membro online</div>
            )}

            {/* Footer */}
            {widgetData && (
              <div className="bg-black/60 border-t border-purple-500/20 p-4">
                <a
                  href={widgetData.instant_invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-lg transition-all uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-95 py-3 text-center border border-purple-400/30"
                >
                  → Entrar no Discord
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}