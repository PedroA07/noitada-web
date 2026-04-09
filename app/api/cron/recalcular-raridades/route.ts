// app/api/cron/recalcular-raridades/route.ts
// Roda automaticamente via Vercel Cron (todo domingo às 3h)
// Recalcula a raridade e pontuação de todas as cartas ativas
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // plano hobby suporta até 60s

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function calcPts(raridade: string, personagem: string, vinculo: string): number {
  const bases: Record<string, number> = { comum: 1, incomum: 10, raro: 50, epico: 200, lendario: 1000 };
  const base = bases[raridade] ?? 1;
  let h = 0;
  const s = (personagem + vinculo).toLowerCase();
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return base + (Math.abs(h) % 50);
}

async function buscarRaridade(personagem: string, vinculo: string): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? process.env.NEXT_PUBLIC_SITE_URL
      : `https://${process.env.VERCEL_URL}`;

    const p = new URLSearchParams({ personagem });
    if (vinculo) p.set('vinculo', vinculo);

    const res = await fetch(`${baseUrl}/api/cartas/raridade?${p}`);
    if (!res.ok) return 'comum';
    const data = await res.json() as { raridade: string };
    return data.raridade ?? 'comum';
  } catch {
    return 'comum';
  }
}

export async function GET(req: NextRequest) {
  // Segurança: verifica Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado' }, { status: 401 });
  }

  const { data: cartas, error } = await supabaseAdmin
    .from('cartas')
    .select('id, personagem, vinculo, raridade')
    .eq('ativa', true);

  if (error || !cartas) {
    return NextResponse.json({ erro: 'Erro ao buscar cartas' }, { status: 500 });
  }

  let atualizadas = 0;

  for (const carta of cartas) {
    try {
      const novaRaridade  = await buscarRaridade(carta.personagem, carta.vinculo);
      const novaPontuacao = calcPts(novaRaridade, carta.personagem, carta.vinculo);

      if (novaRaridade !== carta.raridade) {
        await supabaseAdmin
          .from('cartas')
          .update({ raridade: novaRaridade, pontuacao: novaPontuacao })
          .eq('id', carta.id);
        atualizadas++;
        console.log(`[cron] "${carta.personagem}": ${carta.raridade} → ${novaRaridade}`);
      }

      await new Promise(r => setTimeout(r, 300));
    } catch { /* continua */ }
  }

  return NextResponse.json({
    ok: true,
    total: cartas.length,
    atualizadas,
    executadoEm: new Date().toISOString(),
  });
}