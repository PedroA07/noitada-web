import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID!;

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('configuracoes_cartas_sistema')
    .select('*')
    .eq('guild_id', guildId)
    .maybeSingle();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json(data || {
    intervalo_spawn_minutos: 60,
    canal_spawn_id: '',
    reset_capturas_hora: 0,
    reset_capturas_minuto: 0,
    ativo: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { data, error } = await supabaseAdmin
      .from('configuracoes_cartas_sistema')
      .upsert({
        guild_id: guildId,
        ...body,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'guild_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}