"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

function SpotifyCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl w-full bg-gray-900 border border-white/10 rounded-2xl p-8 space-y-6">
      <h1 className="text-2xl font-black text-fuchsia-400 uppercase tracking-widest">
        🎵 Spotify — Token gerado!
      </h1>

      {code ? (
        <>
          <p className="text-gray-400 text-sm">
            Copie o código abaixo e mande para o Claude continuar a configuração:
          </p>
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 break-all font-mono text-xs text-green-400">
            {code}
          </div>
          <button
            onClick={copiar}
            className="w-full py-3 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl uppercase tracking-widest text-sm transition-all"
          >
            {copiado ? '✅ Copiado!' : 'Copiar código'}
          </button>
        </>
      ) : (
        <p className="text-red-400">Nenhum código encontrado na URL.</p>
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