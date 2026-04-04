import { supabase } from '@/lib/supabase';

export const vincularDiscord = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: `${window.location.origin}/cadastro` },
  });
};

export const finalizarCadastro = async (
  email: string,
  senha: string,
  nascimento: string,
  genero: string,
  nome: string,
  avatarUrl: string,
  discordId: string
) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { sucesso: false, erro: 'Usuário não autenticado.' };

    const { error: profileError } = await supabase.from('perfis').upsert({
      id: session.user.id,
      email,
      nome,
      nascimento: nascimento || null,
      genero: genero || null,
      discord_id: discordId,
      avatar_url: avatarUrl,
      status: 'online',
    });

    if (profileError) return { sucesso: false, erro: profileError.message };

    try {
      await fetch('/api/discord/dar-cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId }),
      });
    } catch (e) {
      console.error('Erro ao agendar cargo:', e);
    }

    return { sucesso: true, erro: '' };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
};

export const entrarComEmail = async (email: string, senha: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { sucesso: false, erro: error.message };
  return { sucesso: true, erro: '' };
};

export const sair = async () => {
  await supabase.auth.signOut();
  window.location.href = '/';
};