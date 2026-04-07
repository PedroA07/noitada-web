"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function Conteudo() {
  const params = useSearchParams();
  const code = params.get('code');
  const [token, setToken] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    fetch('/api/spotify-token?code=' + code)
      .then(r => r.json())
      .then(data => {
        if (data.refresh_token) {
          setToken(data.refresh_token);
        } else {
          setErro('Codigo expirado. Tente novamente.');
        }
      })
      .catch(() => setErro('Erro de conexao.'))
      .finally(() => setLoading(false));
  }, [code]);

  const copiar = () => {
    navigator.clipboard.writeText(token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600, background: '#111', border: '1px solid #333', borderRadius: 16, padding: 32 }}>
      <h1 style={{ color: '#c084fc', fontWeight: 900, marginBottom: 24 }}>Spotify Refresh Token</h1>
      {loading && <p style={{ color: '#9ca3af' }}>Gerando token...</p>}
      {erro && <p style={{ color: '#f87171' }}>{erro}</p>}
      {token && (
        <div>
          <p style={{ color: '#9ca3af', marginBottom: 12 }}>Copie e adicione no Railway como SPOTIFY_REFRESH_TOKEN:</p>
          <div style={{ background: '#000', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 11, color: '#4ade80', wordBreak: 'break-all', marginBottom: 16 }}>
            {token}
          </div>
          <button
            onClick={copiar}
            style={{ width: '100%', padding: '12px', background: '#a855f7', color: '#fff', fontWeight: 900, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14 }}
          >
            {copiado ? 'Copiado!' : 'Copiar Token'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <main style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Suspense fallback={<p style={{ color: '#9ca3af' }}>Carregando...</p>}>
        <Conteudo />
      </Suspense>
    </main>
  );
}