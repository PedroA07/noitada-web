import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: 'env' });
  }

  const { searchParams } = new URL(req.url);
  const discordId = searchParams.get('discord_id')?.trim();

  // Valida que o discord_id é numérico (Discord Snowflake)
  if (!discordId || !/^\d{15,20}$/.test(discordId)) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: 'discord-id-invalido' });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Busca config do servidor
  const { data: cfg } = await sb
    .from('configuracoes_servidor')
    .select('cargo_admin_id, cargo_staff_id')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (!cfg) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: 'sem-config' });
  }

  // Busca o membro no Discord
  const resM = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
    { headers: { Authorization: `Bot ${token}` }, cache: 'no-store' },
  );

  if (!resM.ok) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: `discord-${resM.status}` });
  }

  const membro = await resM.json();
  const roles: string[] = membro.roles || [];

  const isAdmin = !!(cfg.cargo_admin_id && roles.includes(cfg.cargo_admin_id));
  const isStaff = isAdmin || !!(cfg.cargo_staff_id && roles.includes(cfg.cargo_staff_id));

  return NextResponse.json({ isAdmin, isStaff });
}
