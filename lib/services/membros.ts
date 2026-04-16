import { supabase } from '@/lib/supabase';

export const obterMembrosComStatus = async () => {
  try {
    const [resMembros, resCargos] = await Promise.all([
      fetch('/api/discord/membros'),
      fetch('/api/discord/cargos'),
    ]);
    const membros = await resMembros.json();
    const cargos  = await resCargos.json();
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID;

    const { data: configDB } = await supabase
      .from('configuracoes_servidor')
      .select('*')
      .eq('guild_id', guildId)
      .single();

    const { data: perfisDB } = await supabase
      .from('perfis')
      .select('discord_id, status, avatar_url, nome');

    const membrosFormatados = membros.map((m: any) => {
      const perfil   = perfisDB?.find((p: any) => p.discord_id === m.user.id);
      let souAdmin   = false;
      let souStaff   = false;
      if (configDB) {
        souAdmin = m.roles.includes(configDB.cargo_admin_id);
        souStaff = m.roles.includes(configDB.cargo_staff_id) || souAdmin;
      }
      return {
        ...m,
        statusReal: perfil?.status || 'offline',
        isAdmin:    souAdmin,
        isStaff:    souStaff,
        nick:       perfil?.nome || m.nick || m.user.global_name || m.user.username,
      };
    });

    return { membros: membrosFormatados, cargos, config: configDB };
  } catch {
    return { membros: [], cargos: [], config: null };
  }
};

export const sincronizarCargoDiscord = async (
  membroId: string,
  cargoId: string,
  adicionar: boolean,
) => {
  try {
    const res = await fetch('/api/discord/gerenciar-cargo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId, cargoId, acao: adicionar ? 'add' : 'remove' }),
    });
    if (!res.ok) throw new Error('Falha ao sincronizar cargo');
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
};

// Ações disponíveis: kick | ban | timeout | remove_timeout | voice_mute | voice_unmute | nickname
export const moderarMembro = async (
  membroId: string,
  acao: 'kick' | 'ban' | 'timeout' | 'remove_timeout' | 'voice_mute' | 'voice_unmute' | 'nickname',
  dados?: any,
) => {
  try {
    const res = await fetch('/api/discord/moderacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membroId, acao, ...dados }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.erro || 'Erro na moderação');
    return { sucesso: true };
  } catch (error: any) {
    return { sucesso: false, erro: error.message };
  }
};
