"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function RedefinirSenha() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [temSessao, setTemSessao] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) setTemSessao(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setTemSessao(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const temMaiuscula = /[A-Z]/.test(senha);
  const temMinuscula = /[a-z]/.test(senha);
  const temNumero = /[0-9]/.test(senha);
  const temEspecial = /[^A-Za-z0-9]/.test(senha);
  const temTamanho = senha.length >= 8;
  const senhaForte = temMaiuscula && temMinuscula && temNumero && temEspecial && temTamanho;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(''); setMensagem('');
    if (!temSessao) { setErro('Link expirado. Solicite nova recuperação.'); return; }
    if (!senhaForte) { setErro('A senha não atende os requisitos.'); return; }
    if (senha !== confirmarSenha) { setErro('As senhas não coincidem.'); return; }
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) setErro(error.message.includes('different') ? 'A nova senha não pode ser igual à atual.' : 'Erro ao redefinir senha.');
    else { setMensagem('Senha redefinida! Redirecionando...'); setTimeout(() => { window.location.href = '/login'; }, 2000); }
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
      <div className="absolute top-4 left-4 z-20">
        <img src="/images/logo.png" alt="NOITADA Logo" className="h-12 w-auto" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="relative z-20 w-full max-w-md bg-gray-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black text-center text-fuchsia-400 tracking-widest uppercase mb-2">Nova Senha</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Digite sua nova senha abaixo.</p>
        {erro && <div className="p-3 rounded-lg mb-4 text-sm text-center bg-red-500/20 border border-red-500/50 text-red-300">{erro}</div>}
        {mensagem && <div className="p-3 rounded-lg mb-4 text-sm text-center bg-green-500/20 border border-green-500/50 text-green-300">{mensagem}</div>}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-gray-400 mb-1 text-sm">Nova Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Senha forte" required />
          </div>
          <div>
            <label className="block text-gray-400 mb-1 text-sm">Confirmar Senha</label>
            <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
              className={`w-full bg-gray-950 border rounded-lg px-4 py-3 text-white focus:outline-none transition-all ${confirmarSenha && senha !== confirmarSenha ? 'border-red-500' : 'border-gray-700 focus:border-fuchsia-500'}`}
              placeholder="Repita" required />
          </div>
          {senha.length > 0 && (
            <div className="text-xs space-y-1 p-3 bg-gray-950/50 rounded-lg border border-gray-800">
              {[['Maiúscula', temMaiuscula], ['Minúscula', temMinuscula], ['Número', temNumero], ['Especial', temEspecial], ['8+ caracteres', temTamanho]].map(([l, ok]) => (
                <p key={l as string} className={ok ? 'text-green-400' : 'text-gray-500'}>{ok ? '✓' : '○'} {l}</p>
              ))}
            </div>
          )}
          <button type="submit" className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95">
            Redefinir Senha
          </button>
        </form>
        <Link href="/login" className="block mt-6 text-center text-sm text-gray-400 hover:text-white transition-colors">Voltar ao Login</Link>
      </div>
    </main>
  );
}