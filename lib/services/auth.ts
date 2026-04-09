import { supabase } from '@/lib/supabase';

export const vincularDiscord = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: { redirectTo: `${window.location.origin}/cadastro` },
  });
};

export const finalizarCadastro = async ({
  email,
  senha,
  nome,
  nascimento,
  genero,
  avatarUrl,
  discordId,
}: {
  email: string;
  senha: string;
  nome: string;
  nascimento: string;
  genero: string;
  avatarUrl: string;
  discordId: string;
}) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { sucesso: false, erro: 'Sessão do Discord não encontrada. Vincule novamente.' };

    // Atualiza o e-mail e a senha do usuário OAuth já autenticado
    const { error: updateError } = await supabase.auth.updateUser({ email, password: senha });
    if (updateError) return { sucesso: false, erro: updateError.message };

    // Salva o perfil via API (usa service role para burlar RLS)
    const resPerfil = await fetch('/api/perfil/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: session.user.id,
        email,
        nome,
        nascimento,
        genero,
        discord_id: discordId,
        avatar_url: avatarUrl || null,
      }),
    });

    if (!resPerfil.ok) {
      const body = await resPerfil.json().catch(() => ({}));
      return { sucesso: false, erro: 'Erro ao salvar perfil: ' + (body.erro || 'Erro desconhecido') };
    }

    // Agenda a entrega do cargo no Discord
    await fetch('/api/discord/dar-cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discordId }),
    }).catch(e => console.error('Erro ao agendar cargo:', e));

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