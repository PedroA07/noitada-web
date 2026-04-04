"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { finalizarCadastro, vincularDiscord } from '@/lib/services/auth';

const generos = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'nao_informar', label: 'Prefiro não informar' },
  { value: 'outro', label: 'Outro' },
];

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [ano, setAno] = useState('');

  const meses = [
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' },
  ];

  const dias = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: String(i + 1) }));
  const anos = Array.from({ length: new Date().getFullYear() - 1900 - 13 }, (_, i) => ({ value: String(new Date().getFullYear() - 13 - i), label: String(new Date().getFullYear() - 13 - i) }));

  const nascimento = ano && mes && dia ? `${ano}-${mes}-${dia}` : '';
  const [genero, setGenero] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [discordEmail, setDiscordEmail] = useState('');
  const [discordNome, setDiscordNome] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [discordAvatar, setDiscordAvatar] = useState('');
  const [discordSession, setDiscordSession] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const carregarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setDiscordSession(true);
        setDiscordEmail(session.user.email ?? '');
        setDiscordNome(
          (session.user.user_metadata as any)?.full_name ||
          (session.user.user_metadata as any)?.name ||
          (session.user.user_metadata as any)?.user_name ||
          ''
        );
        setDiscordAvatar((session.user.user_metadata as any)?.avatar_url || '');
        const identities = (session.user as any).identities;
        const discordIdentity = Array.isArray(identities)
          ? identities.find((item: any) => item.provider === 'discord')
          : undefined;
        const providerId = discordIdentity?.identity_id || (session.user.app_metadata as any)?.provider_user_id || '';
        setDiscordId(providerId);

        if (session.user.email) {
          setEmail(session.user.email);
        }
        if (!nome && discordNome) {
          setNome(discordNome);
        }
      }
    };

    carregarSessao();
  }, [nome]);

  const forcaSenha = useMemo(
    () => ({
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /[0-9]/.test(senha),
      especial: /[^A-Za-z0-9]/.test(senha),
      tamanho: senha.length >= 8,
    }),
    [senha]
  );

  const senhasConferem = senha.length > 0 && senha === confirmarSenha;
  const senhaForte = Object.values(forcaSenha).every(Boolean);

  const preencherEmailDiscord = () => {
    if (discordEmail) setEmail(discordEmail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLoading(true);

    if (!nome.trim()) {
      setErro('Digite seu nome completo.');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErro('Digite um email válido.');
      setLoading(false);
      return;
    }

    if (!dia || !mes || !ano) {
      setErro('Informe sua data de nascimento completa.');
      setLoading(false);
      return;
    }

    if (!genero) {
      setErro('Selecione seu gênero.');
      setLoading(false);
      return;
    }

    if (discordSession) {
      const resultado = await finalizarCadastro(email, senha, nascimento, genero, nome, discordAvatar, discordId);
      if (resultado.sucesso) {
        router.push('/dashboard');
      } else {
        setErro(resultado.erro || 'Erro ao finalizar cadastro com Discord.');
      }
      setLoading(false);
      return;
    }

    if (!senhaForte) {
      setErro('A senha precisa ser mais forte.');
      setLoading(false);
      return;
    }

    if (!senhasConferem) {
      setErro('As senhas não conferem.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) {
        setErro(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const { error: perfilError } = await supabase.from('perfis').insert({
          id: data.user.id,
          email,
          nome,
          nascimento,
          genero,
          discord_id: discordId || null,
          avatar_url: discordAvatar || null,
          status: 'offline',
        });

        if (perfilError) {
          setErro(perfilError.message);
          setLoading(false);
          return;
        }
      }

      setSucesso('Conta criada! Verifique seu email para confirmar o cadastro.');
      setSenha('');
      setConfirmarSenha('');
      setLoading(false);
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar conta.');
      setLoading(false);
    }
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative z-20 w-full max-w-md bg-gray-900/80 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="mb-6">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Voltar
          </Link>
        </div>

        <h1 className="text-3xl font-black text-center text-fuchsia-400 tracking-widest uppercase mb-2">NOITADA</h1>
        <p className="text-gray-400 text-center text-sm mb-6">Crie sua conta ou finalize com Discord.</p>

        <button
          type="button"
          onClick={vincularDiscord}
          className="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm py-3 mb-6"
        >
          Entrar com Discord
        </button>

        {discordSession && discordEmail && (
          <div className="mb-6 rounded-2xl border border-fuchsia-500/30 bg-white/5 p-4 text-sm text-gray-300">
            <p className="font-bold text-white mb-2">Conta Discord detectada</p>
            <p>Seu Discord está conectado com o email <strong>{discordEmail}</strong>.</p>
            <button
              type="button"
              onClick={preencherEmailDiscord}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-fuchsia-500 px-3 py-2 text-sm text-fuchsia-300 hover:bg-fuchsia-500/10"
            >
              Usar este email
            </button>
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
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Data de nascimento</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={dia}
                  onChange={e => setDia(e.target.value)}
                  className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all text-sm"
                  required
                >
                  <option value="" disabled>Dia</option>
                  {dias.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                <select
                  value={mes}
                  onChange={e => setMes(e.target.value)}
                  className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all text-sm"
                  required
                >
                  <option value="" disabled>Mês</option>
                  {meses.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={ano}
                  onChange={e => setAno(e.target.value)}
                  className="bg-gray-950 border border-gray-700 rounded-xl px-3 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all text-sm"
                  required
                >
                  <option value="" disabled>Ano</option>
                  {anos.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gray-400">Gênero</label>
              <select
                value={genero}
                onChange={e => setGenero(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
                required
              >
                <option value="" disabled>Selecione</option>
                {generos.map(g => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!discordSession && (
            <>
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
                <button
                  type="button"
                  onClick={() => setMostrarSenha(prev => !prev)}
                  className="absolute right-3 top-10 text-xs text-gray-400 hover:text-white"
                >
                  {mostrarSenha ? 'Esconder' : 'Ver'}
                </button>
              </div>

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
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha(prev => !prev)}
                  className="absolute right-3 top-10 text-xs text-gray-400 hover:text-white"
                >
                  {mostrarConfirmarSenha ? 'Esconder' : 'Ver'}
                </button>
              </div>

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
                  {senha ? (senhaForte ? 'Senha forte' : 'Senha fraca') : 'Digite a senha para avaliar.'}
                </p>
                <p className={`mt-2 text-xs ${senhasConferem ? 'text-emerald-300' : 'text-gray-500'}`}>
                  {confirmarSenha ? (senhasConferem ? 'As senhas conferem.' : 'As senhas não conferem.') : 'Confirme sua senha.'}
                </p>
              </div>
            </>
          )}

          {erro && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{erro}</div>}
          {sucesso && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{sucesso}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm py-3 disabled:opacity-50"
          >
            {discordSession ? 'Finalizar cadastro' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">Já tem conta?</p>
          <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-bold">
            Faça login
          </Link>
        </div>
      </div>
    </main>
  );
}
