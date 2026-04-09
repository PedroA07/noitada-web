"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { vincularDiscord, finalizarCadastro } from '@/lib/services/auth';
import { CalendarPicker, DropdownPicker } from '@/lib/components';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [emailDiscord, setEmailDiscord] = useState(''); // e-mail vindo do Discord
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
        const emailVindo = meta.email || '';
        setEmailDiscord(emailVindo);
        setEmail(emailVindo); // pré-preenche com e-mail do Discord
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
        const emailVindo = meta.email || '';
        setEmailDiscord(emailVindo);
        setEmail(emailVindo);
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
    if (!nascimento) { setErro('Informe sua data de nascimento.'); setLoading(false); return; }
    if (!genero) { setErro('Selecione seu gênero.'); setLoading(false); return; }
    if (!senhaForte) { setErro('A senha precisa ser mais forte.'); setLoading(false); return; }
    if (!senhasConferem) { setErro('As senhas não conferem.'); setLoading(false); return; }

    const resultado = await finalizarCadastro({
      email,
      senha,
      nome,
      nascimento,
      genero,
      avatarUrl: discordAvatar,
      discordId,
    });

    if (!resultado.sucesso) {
      setErro(resultado.erro);
      setLoading(false);
      return;
    }

    setSucesso('🎉 Cadastro concluído! Verifique seu e-mail para confirmar. O cargo Membro será entregue automaticamente no Discord.');
    setSenha('');
    setConfirmarSenha('');
    setLoading(false);

    // Redireciona para o dashboard após 3 segundos
    setTimeout(() => router.push('/dashboard'), 3000);
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

        {/* Botão Discord */}
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
          {discordSession
            ? `✅ Discord vinculado: ${discordNome}`
            : '🎮 Vincular Discord (obrigatório)'}
        </button>

        {!discordSession && (
          <p className="text-xs text-amber-400 text-center mb-4">⚠️ Você precisa vincular o Discord para criar a conta.</p>
        )}

        {/* Aviso de e-mail recomendado */}
        {discordSession && emailDiscord && (
          <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-200">
            💡 Recomendamos usar o mesmo e-mail da sua conta Discord:
            <span className="font-bold text-white ml-1">{emailDiscord}</span>
          </div>
        )}

        {discordSession && !emailDiscord && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
            Discord conectado! Preencha os dados abaixo para finalizar.
          </div>
        )}

        {/* Avatar do Discord */}
        {discordSession && discordAvatar && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <img src={discordAvatar} alt="Avatar Discord" className="w-10 h-10 rounded-full" />
            <div>
              <p className="text-xs text-gray-400">Logado como</p>
              <p className="text-sm font-bold text-white">{discordNome}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Nome completo</label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              disabled={!discordSession}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all disabled:opacity-40"
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
              disabled={!discordSession}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all disabled:opacity-40"
              placeholder="seu@email.com"
              required
            />
            {discordSession && emailDiscord && email !== emailDiscord && (
              <p className="text-xs text-amber-400 mt-1">
                ⚠️ E-mail diferente do Discord. Certifique-se que é isso mesmo.
              </p>
            )}
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
              disabled={!discordSession}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:border-fuchsia-500 transition-all disabled:opacity-40"
              placeholder="Crie uma senha forte"
              required
            />
            <button type="button" onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-8 text-gray-400 hover:text-white transition-colors">
              {mostrarSenha ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Indicador de força da senha */}
          {senha.length > 0 && (
            <div className="grid grid-cols-5 gap-1">
              {Object.entries(forcaSenha).map(([k, v]) => (
                <div key={k} className={`h-1 rounded-full transition-all ${v ? 'bg-fuchsia-500' : 'bg-gray-700'}`} />
              ))}
            </div>
          )}

          <div className="relative">
            <label className="text-xs uppercase tracking-widest text-gray-400">Confirmar senha</label>
            <input
              value={confirmarSenha}
              onChange={e => setConfirmarSenha(e.target.value)}
              type={mostrarConfirmarSenha ? 'text' : 'password'}
              disabled={!discordSession}
              className={`w-full bg-gray-950 border rounded-xl px-4 py-3 pr-12 text-white focus:outline-none transition-all disabled:opacity-40 ${
                confirmarSenha.length > 0
                  ? senhasConferem ? 'border-green-500' : 'border-red-500'
                  : 'border-gray-700'
              }`}
              placeholder="Repita a senha"
              required
            />
            <button type="button" onClick={() => setMostrarConfirmarSenha(v => !v)}
              className="absolute right-3 top-8 text-gray-400 hover:text-white transition-colors">
              {mostrarConfirmarSenha ? '🙈' : '👁️'}
            </button>
          </div>

          {erro && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{erro}</p>}
          {sucesso && <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">{sucesso}</p>}

          <button
            type="submit"
            disabled={!discordSession || loading}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black py-3 rounded-xl uppercase tracking-widest transition-all"
          >
            {loading ? 'Criando conta...' : 'Finalizar cadastro'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Entrar</Link>
        </p>
      </div>
    </main>
  );
}