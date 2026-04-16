import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  const guildId = process.env.DISCORD_GUILD_ID;
  const sb = adminClient();

  const { data, error } = await sb
    .from('configuracoes_cores')
    .select('*')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const guildId = process.env.DISCORD_GUILD_ID;
  const sb = adminClient();

  try {
    const corpo = await req.json();
    const { error } = await sb
      .from('configuracoes_cores')
      .upsert({ guild_id: guildId, ...corpo }, { onConflict: 'guild_id' });

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ sucesso: true });
  } catch (e: any) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
