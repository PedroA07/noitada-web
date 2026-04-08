"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { vincularDiscord } from '@/lib/services/auth';
import { CalendarPicker, DropdownPicker } from '@/lib/components';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [genero, setGenero] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [discordNome, setDiscordNome] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [discordAvatar, setDiscordAvatar] = useState('');
  const [discordSession, setDiscordSession] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const detectar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const meta = session.user.user_metadata;
      const provider = session.user.app_metadata?.provider;
      if (provider === 'discord') {
        setDiscordSession(true);
        setDiscordId(meta.provider_id || meta.sub || '');
        setDiscordNome(meta.full_name || meta.name || '');
        setDiscordAvatar(meta.avatar_url || '');
        if (meta.email) setEmail(meta.email);
        if (meta.full_name || meta.name) setNome(meta.full_name || meta.name || '');
      }
    };
    detectar();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      const meta = session.user.user_metadata;
      const provider = session.user.app_metadata?.provider;
      if (provider === 'discord') {
        setDiscordSession(true);
        setDiscordId(meta.provider_id || meta.sub || '');
        setDiscordNome(meta.full_name || meta.name || '');
        setDiscordAvatar(meta.avatar_url || '');
        if (meta.email) setEmail(meta.email);
        if (meta.full_name || meta.name) setNome(meta.full_name || meta.name || '');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const forcaSenha = useMemo(() => ({
    maiuscula: /[A-Z]/.test(senha),
    minuscula: /[a-z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: /[^A-Za-z0-9]/.test(senha),
    tamanho: senha.length >= 8,
  }), [senha]);

  const senhasConferem = senha.length > 0 && senha === confirmarSenha;
  const senhaForte = Object.values(forcaSenha).every(Boolean);

  // Extrai dia/mes/ano do valor ISO para validação no submit
  const [anoV, mesV, diaV] = nascimento ? nascimento.split('-') : ['', '', ''];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    if (!discordSession || !discordId) {
      setErro('Você precisa vincular sua conta do Discord antes de continuar.');
      setLoading(false);
      return;
    }

    if (!nome.trim()) { setErro('Digite seu nome completo.'); setLoading(false); return; }
    if (!email.trim()) { setErro('Digite um email válido.'); setLoading(false); return; }
    if (!nascimento) { setErro('Informe sua data de nascimento completa.'); setLoading(false); return; }
    if (!genero) { setErro('Selecione seu gênero.'); setLoading(false); return; }
    if (!senhaForte) { setErro('A senha precisa ser mais forte.'); setLoading(false); return; }
    if (!senhasConferem) { setErro('As senhas não conferem.'); setLoading(false); return; }

    const discordIdSalvo = discordId;
    const discordAvatarSalvo = discordAvatar;

    try {
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) { setErro(error.message); setLoading(false); return; }
      if (!data?.user) { setErro('Erro ao criar usuário. Tente novamente.'); setLoading(false); return; }

      const resPerfil = await fetch('/api/perfil/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.user.id,
          email,
          nome,
          nascimento,
          genero,
          discord_id: discordIdSalvo,
          avatar_url: discordAvatarSalvo || null,
        }),
      });

      if (!resPerfil.ok) {
        const body = await resPerfil.json().catch(() => ({}));
        setErro('Erro ao salvar perfil: ' + (body.erro || 'Erro desconhecido'));
        setLoading(false);
        return;
      }

      const resCargo = await fetch('/api/discord/dar-cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: discordIdSalvo }),
      });

      if (!resCargo.ok) {
        const body = await resCargo.json().catch(() => ({}));
        console.error('Erro ao agendar cargo:', body);
      }

      setSucesso('Conta criada! Verifique seu email para confirmar o cadastro. O cargo será entregue automaticamente no Discord.');
      setSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar conta.');
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <video autoPlay loop muted className="absolute inset-0 w-full h-full object-cover z-0" src="/videos/background.mp4" />
      <div className="absolute inset-0 bg-black/50 z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-20 w-full max-w-md bg-gray-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">← Voltar</Link>
        </div>

        <h1 className="text-3xl font-black text-center text-fuchsia-400 tracking-widest uppercase mb-2">NOITADA</h1>
        <p className="text-gray-400 text-center text-sm mb-6">Crie sua conta vinculando o Discord.</p>

        <button
          type="button"
          onClick={vincularDiscord}
          disabled={discordSession}
          className={`w-full flex items-center justify-center gap-3 font-black rounded-xl transition-all uppercase tracking-widest text-sm py-3 mb-2 ${
            discordSession
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
          }`}
        >
          {discordSession ? `✅ Discord vinculado: ${discordNome}` : 'Vincular Discord (obrigatório)'}
        </button>

        {!discordSession && (
          <p className="text-xs text-amber-400 text-center mb-4">⚠️ Você precisa vincular o Discord para criar a conta.</p>
        )}

        {discordSession && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
            Discord conectado! Preencha os dados abaixo para finalizar.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Nome completo</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Nome completo"
              required
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CalendarPicker
              label="Data de nascimento"
              placeholder="Selecione a data"
              value={nascimento}
              onChange={setNascimento}
            />

            <DropdownPicker
              label="Gênero"
              placeholder="Gênero"
              value={genero}
              onChange={setGenero}
              options={[
                { value: 'masculino', label: 'Masculino' },
                { value: 'feminino', label: 'Feminino' },
                { value: 'nao_informar', label: 'Prefiro não informar' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
          </div>

          <div className="relative">
            <label className="text-xs uppercase tracking-widest text-gray-400">Senha</label>
            <input
              value={senha}
              onChange={e => setSenha(e.target.value)}
              type={mostrarSenha ? 'text' : 'password'}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Senha"
              required
            />
            <button type="button" onClick={() => setMostrarSenha(p => !p)} className="absolute right-3 top-10 text-gray-400 hover:text-white transition-colors">
              {mostrarSenha
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>

          {senha.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
              <p className="font-bold text-white mb-2">Força da senha</p>
              <div className="space-y-2">
                {([
                  ['Maiúsculas', forcaSenha.maiuscula],
                  ['Minúsculas', forcaSenha.minuscula],
                  ['Números', forcaSenha.numero],
                  ['Caracteres especiais', forcaSenha.especial],
                  ['Mínimo 8 caracteres', forcaSenha.tamanho],
                ] as [string, boolean][]).map(([label, ok]) => (
                  <p key={label} className={ok ? 'text-emerald-400' : 'text-gray-500'}>
                    {ok ? '✓' : '○'} {label}
                  </p>
                ))}
              </div>
              <p className={`mt-3 text-xs ${senhaForte ? 'text-emerald-300' : 'text-gray-500'}`}>
                {senhaForte ? 'Senha forte' : 'Senha fraca'}
              </p>
            </div>
          )}

          <div className="relative">
            <label className="text-xs uppercase tracking-widest text-gray-400">Confirmar senha</label>
            <input
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              type={mostrarConfirmarSenha ? 'text' : 'password'}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Confirmar senha"
              required
            />
            <button type="button" onClick={() => setMostrarConfirmarSenha(p => !p)} className="absolute right-3 top-10 text-gray-400 hover:text-white transition-colors">
              {mostrarConfirmarSenha
                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>

          {confirmarSenha.length > 0 && (
            <p className={`text-xs ${senhasConferem ? 'text-emerald-300' : 'text-red-300'}`}>
              {senhasConferem ? '✓ As senhas conferem' : '✗ As senhas não conferem'}
            </p>
          )}

          {erro && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{erro}</div>
          )}
          {sucesso && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{sucesso}</div>
          )}

          <button
            type="submit"
            disabled={loading || !discordSession}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm py-3 disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Já tem conta?{' '}
            <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-bold">Faça login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}