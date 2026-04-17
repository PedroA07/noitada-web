import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Total geral (incluindo variações)
    const { count: totalGeral } = await supabaseAdmin
      .from('cartas')
      .select('*', { count: 'exact', head: true })
      .eq('ativa', true);

    // Total somente principais (sem variações)
    const { count: totalPrincipais } = await supabaseAdmin
      .from('cartas')
      .select('*', { count: 'exact', head: true })
      .eq('ativa', true)
      .is('carta_principal_id', null);

    // Total por raridade (somente principais)
    const raridades = ['comum', 'incomum', 'raro', 'epico', 'lendario'];
    const contagensPorRaridade = await Promise.all(
      raridades.map(async raridade => {
        const { count } = await supabaseAdmin
          .from('cartas')
          .select('*', { count: 'exact', head: true })
          .eq('ativa', true)
          .eq('raridade', raridade)
          .is('carta_principal_id', null);
        return { raridade, count: count ?? 0 };
      }),
    );

    const porRaridade = Object.fromEntries(
      contagensPorRaridade.map(({ raridade, count }) => [raridade, count]),
    );

    return NextResponse.json({
      totalGeral:      totalGeral      ?? 0,
      totalPrincipais: totalPrincipais ?? 0,
      porRaridade,
    });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}
