"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SpotifyCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [refreshToken, setRefreshToken] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);

    fetch(`/api/spotify-token?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token);
        } else {
          setErro('Erro ao obter token. O código pode ter expirado. Tente novamente.');
          console.error(data);
        }
      })
      .catch(() => setErro('Erro de conexão.'))
      .finally(() => setLoading(false));
  }, [code]);

  const copiar = () => {
    navigator.clipboard.writeText(refreshToken);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-2xl w-full bg-gray-900 border border-white/10 rounded-2xl p-8 space-y-6">
      <h1 className="text-2xl font-black text-fuchsia-400 uppercase tracking-widest">
        🎵 Spotify — Refresh Token
      </h1>

      {loading && <p className="text-gray-400">⏳ Gerando token...</p>}

      {erro && (
        <div className="space-y-4">
          <p className="text-red-400">{erro}</p>
          
            href={`https://accounts.spotify.com/authorize?client_id=0d4ee72318ab43e0ba1e5b7c732b2548&response_type=code&redirect_uri=https://www.noitadaserver.com.br/spotify-callback&scope=user-read-private%20user-read-email%20playlist-read-private%20playlist-read-collaborative`}
            className="block w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all text-center"
          >
            Tentar novamente
          </a>
        </div>
      )}

      {refreshToken && (
        <>
          <p className="text-gray-400 text-sm">
            ✅ <strong className="text-white">Refresh Token gerado!</strong> Copie e adicione no Railway como <code className="bg-white/10 px-1 rounded">SPOTIFY_REFRESH_TOKEN</code>
          </p>
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 break-all font-mono text-xs text-green-400">
            {refreshToken}
          </div>
          <button
            onClick={copiar}
            className="w-full py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all"
          >
            {copiado ? '✅ Copiado!' : 'Copiar Refresh Token'}
          </button>
        </>
      )}
    </div>
  );
}

export default function SpotifyCallback() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <Suspense fallback={<p className="text-gray-400">Carregando...</p>}>
        <SpotifyCallbackContent />
      </Suspense>
    </main>
  );
}