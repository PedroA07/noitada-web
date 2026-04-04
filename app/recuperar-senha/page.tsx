"use client";

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setErro('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) setErro('Erro ao enviar email. Verifique e tente novamente.');
    else setSucesso(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/videos/background.mp4"
      />
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-20 w-full max-w-md bg-gray-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Voltar
          </Link>
        </div>
        {!sucesso ? (
          <>
            <h1 className="text-2xl font-black text-center text-fuchsia-400 tracking-widest uppercase mb-2">Esqueci a Senha</h1>
            <p className="text-gray-400 text-sm text-center mb-8">Digite seu email para receber o link de recuperação.</p>
            {erro && <div className="p-3 rounded-lg mb-4 text-sm text-center bg-red-500/20 border border-red-500/50 text-red-300">{erro}</div>}
            <form onSubmit={handleReset} className="space-y-6">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com"
                className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all" />
              <button type="submit" disabled={loading}
                className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar Link'}
              </button>
            </form>
            <Link href="/login" className="block mt-6 text-center text-sm text-gray-400 hover:text-white transition-colors">Voltar ao Login</Link>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-6xl mb-6">🦉</div>
            <h2 className="text-2xl font-black text-white mb-4">SINAL ENVIADO!</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">Enviamos o link para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.</p>
            <button onClick={() => { setSucesso(false); setEmail(''); }}
              className="w-full border border-fuchsia-600 text-fuchsia-400 hover:bg-fuchsia-600/10 font-bold py-3 rounded-lg transition-all">
              Tentar outro email
            </button>
            <Link href="/login" className="block mt-4 text-center text-sm text-gray-400 hover:text-white transition-colors">Voltar ao Login</Link>
          </div>
        )}
      </div>
    </main>
  );
}