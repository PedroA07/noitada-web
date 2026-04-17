import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const sbUrl   = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sbSvc   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!token || !guildId) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: 'env' });
  }

  // Autentica o usuário pelo JWT enviado no header Authorization
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.replace('Bearer ', '').trim();

  if (!jwt) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: 'sem-jwt' });
  }

  // Valida o JWT usando o service role client (supabase-js v2: passa JWT direto)
  const sb = createClient(sbUrl, sbSvc);
  const { data: { user }, error: authErr } = await sb.auth.getUser(jwt);
  if (authErr || !user) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: 'jwt-invalido' });
  }

  // Busca discord_id do usuário e config do servidor em paralelo
  const [resPerfil, resCfg] = await Promise.all([
    sb.from('perfis').select('discord_id').eq('id', user.id).maybeSingle(),
    sb.from('configuracoes_servidor')
      .select('cargo_admin_id, cargo_staff_id')
      .eq('guild_id', guildId)
      .maybeSingle(),
  ]);

  const discordId = resPerfil.data?.discord_id as string | undefined;
  const cfg       = resCfg.data;

  if (!discordId || !cfg) {
    return NextResponse.json({ isAdmin: false, isStaff: false, erro: !discordId ? 'sem-discord-id' : 'sem-config' });
  }

  // Busca o membro específico no Discord
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
