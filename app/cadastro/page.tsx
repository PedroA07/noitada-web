"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { vincularDiscord } from '@/lib/services/auth';

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
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarGenero, setMostrarGenero] = useState(false);
  const [calendarioMes, setCalendarioMes] = useState(new Date().getMonth());
  const [calendarioAno, setCalendarioAno] = useState(new Date().getFullYear());
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
    const detectar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const meta = session.user.user_metadata;
      const provider = session.user.app_metadata?.provider;
      if (provider === 'discord') {
        setDiscordSession(true);
        setDiscordId(meta.provider_id || meta.sub || '');
        setDiscordEmail(meta.email || '');
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
        setDiscordEmail(meta.email || '');
        setDiscordNome(meta.full_name || meta.name || '');
        setDiscordAvatar(meta.avatar_url || '');
        if (meta.email) setEmail(meta.email);
        if (meta.full_name || meta.name) setNome(meta.full_name || meta.name || '');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.dropdown-container')) {
        setMostrarCalendario(false);
        setMostrarGenero(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gerarDiasCalendario = () => {
    const primeiroDia = new Date(calendarioAno, calendarioMes, 1);
    const ultimoDia = new Date(calendarioAno, calendarioMes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    const dias = [];
    for (let i = 0; i < diaSemanaInicio; i++) dias.push(null);
    for (let i = 1; i <= diasNoMes; i++) dias.push(i);
    return dias;
  };

  const selecionarData = (diaSelecionado: number) => {
    setDia(String(diaSelecionado).padStart(2, '0'));
    setMes(String(calendarioMes + 1).padStart(2, '0'));
    setAno(String(calendarioAno));
    setMostrarCalendario(false);
  };

  const navegarMes = (direcao: number) => {
    let novoMes = calendarioMes + direcao;
    let novoAno = calendarioAno;
    if (novoMes < 0) { novoMes = 11; novoAno--; }
    else if (novoMes > 11) { novoMes = 0; novoAno++; }
    setCalendarioMes(novoMes);
    setCalendarioAno(novoAno);
  };

  const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const nascimento = ano && mes && dia ? `${ano}-${mes}-${dia}` : '';

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
    if (!dia || !mes || !ano) { setErro('Informe sua data de nascimento completa.'); setLoading(false); return; }
    if (!genero) { setErro('Selecione seu gênero.'); setLoading(false); return; }
    if (!senhaForte) { setErro('A senha precisa ser mais forte.'); setLoading(false); return; }
    if (!senhasConferem) { setErro('As senhas não conferem.'); setLoading(false); return; }

    // Salva discordId localmente antes de qualquer operação async
    // pois o signUp pode sobrescrever a sessão OAuth
    const discordIdSalvo = discordId;
    const discordAvatarSalvo = discordAvatar;

    try {
      // 1. Cria o usuário no Supabase Auth com email+senha
      const { data, error } = await supabase.auth.signUp({ email, password: senha });
      if (error) { setErro(error.message); setLoading(false); return; }
      if (!data?.user) { setErro('Erro ao criar usuário. Tente novamente.'); setLoading(false); return; }

      // 2. Cria o perfil — usa service role via API para não depender da sessão atual
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
        console.error('Erro ao criar perfil:', body);
        setErro('Erro ao salvar perfil: ' + (body.erro || 'Erro desconhecido'));
        setLoading(false);
        return;
      }

      // 3. Agenda entrega do cargo
      const resCargo = await fetch('/api/discord/dar-cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId: discordIdSalvo }),
      });

      if (!resCargo.ok) {
        const body = await resCargo.json().catch(() => ({}));
        console.error('Erro ao agendar cargo:', body);
        // Não bloqueia o cadastro — o cargo pode ser entregue manualmente
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
          className={`w-full flex items-center justify-center gap-3 font-black rounded-xl transition-all uppercase tracking-widest text-sm py-3 mb-2 ${
            discordSession
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-[#5865F2] hover:bg-[#4752c4] text-white'
          }`}
          disabled={discordSession}
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
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Nome completo" required />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest text-gray-400">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="seu@email.com" required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative dropdown-container">
              <label className="text-xs uppercase tracking-widest text-gray-400">Data de nascimento</label>
              <div className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer flex items-center justify-between"
                onClick={() => setMostrarCalendario(!mostrarCalendario)}>
                <span className={nascimento ? 'text-white' : 'text-gray-500'}>
                  {nascimento ? `${dia}/${mes}/${ano}` : 'Selecione a data'}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {mostrarCalendario && (
                <div className="absolute top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button type="button" onClick={() => navegarMes(-1)} className="text-fuchsia-400 hover:text-fuchsia-300 p-2 hover:bg-gray-800 rounded-lg transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span className="text-white font-bold text-lg">{mesesNomes[calendarioMes]} {calendarioAno}</span>
                    <button type="button" onClick={() => navegarMes(1)} className="text-fuchsia-400 hover:text-fuchsia-300 p-2 hover:bg-gray-800 rounded-lg transition-all">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                      <div key={d} className="text-center text-sm text-gray-400 font-bold py-2">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {gerarDiasCalendario().map((diaNum, index) => (
                      <button type="button" key={index} onClick={() => diaNum && selecionarData(diaNum)} disabled={!diaNum}
                        className={`text-center py-3 px-2 text-sm rounded-lg transition-all ${diaNum ? 'text-white hover:bg-fuchsia-600 hover:text-white hover:scale-105' : ''} ${diaNum === parseInt(dia) && calendarioMes === parseInt(mes) - 1 && calendarioAno === parseInt(ano) ? 'bg-fuchsia-600 text-white scale-105' : 'text-gray-400'}`}>
                        {diaNum || ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative dropdown-container">
              <label className="text-xs uppercase tracking-widest text-gray-400">Gênero</label>
              <div className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white cursor-pointer flex items-center justify-between"
                onClick={() => setMostrarGenero(!mostrarGenero)}>
                <span className={genero ? 'text-white' : 'text-gray-500'}>
                  {genero ? generos.find(g => g.value === genero)?.label : 'Gênero'}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {mostrarGenero && (
                <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
                  {generos.map(g => (
                    <button type="button" key={g.value} onClick={() => { setGenero(g.value); setMostrarGenero(false); }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-fuchsia-600 hover:text-white transition-all first:rounded-t-xl last:rounded-b-xl">
                      {g.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <label className="text-xs uppercase tracking-widest text-gray-400">Senha</label>
            <input value={senha} onChange={e => setSenha(e.target.value)} type={mostrarSenha ? 'text' : 'password'}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Senha" required />
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
                {([['Maiúsculas', forcaSenha.maiuscula],['Minúsculas', forcaSenha.minuscula],['Números', forcaSenha.numero],['Caracteres especiais', forcaSenha.especial],['Mínimo 8 caracteres', forcaSenha.tamanho]] as [string, boolean][]).map(([label, ok]) => (
                  <p key={label} className={ok ? 'text-emerald-400' : 'text-gray-500'}>{ok ? '✓' : '○'} {label}</p>
                ))}
              </div>
              <p className={`mt-3 text-xs ${senhaForte ? 'text-emerald-300' : 'text-gray-500'}`}>{senhaForte ? 'Senha forte' : 'Senha fraca'}</p>
            </div>
          )}

          <div className="relative">
            <label className="text-xs uppercase tracking-widest text-gray-400">Confirmar senha</label>
            <input value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} type={mostrarConfirmarSenha ? 'text' : 'password'}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-all"
              placeholder="Confirmar senha" required />
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

          {erro && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">{erro}</div>}
          {sucesso && <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{sucesso}</div>}

          <button type="submit" disabled={loading || !discordSession}
            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-black rounded-xl transition-all uppercase tracking-widest text-sm py-3 disabled:opacity-50">
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">Já tem conta?{' '}
            <Link href="/login" className="text-fuchsia-400 hover:text-fuchsia-300 font-bold">Faça login</Link>
          </p>
        </div>
      </div>
    </main>
  );
}