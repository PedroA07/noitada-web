import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID!;

  const { data, error } = await supabaseAdmin
    .from('configuracoes_roll')
    .select('*')
    .eq('guild_id', guildId)
    .order('cartas_por_roll', { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  try {
    const guildId = process.env.NEXT_PUBLIC_DISCORD_GUILD_ID!;
    const body = await req.json();
    const { cargo_id, cargo_nome, cooldown_valor, cooldown_unidade, rolls_por_periodo, cartas_por_roll } = body;

    if (!cargo_id || !cargo_nome) {
      return NextResponse.json({ erro: 'cargo_id e cargo_nome são obrigatórios' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('configuracoes_roll')
      .upsert({
        guild_id: guildId,
        cargo_id,
        cargo_nome,
        cooldown_valor: cooldown_valor || 30,
        cooldown_unidade: cooldown_unidade || 'minutos',
        rolls_por_periodo: rolls_por_periodo || 5,
        cartas_por_roll: cartas_por_roll || 1,
      }, { onConflict: 'guild_id,cargo_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('configuracoes_roll')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}