import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q     = searchParams.get('q') || '';
  const campo = searchParams.get('campo') === 'sub_vinculo' ? 'sub_vinculo' : 'vinculo';

  if (q.trim().length < 1) return NextResponse.json([]);

  const { data, error } = await supabaseAdmin
    .from('cartas')
    .select(campo)
    .eq('ativa', true)
    .ilike(campo, `%${q.trim()}%`)
    .not(campo, 'is', null)
    .limit(30);

  if (error) return NextResponse.json([]);

  // Trim + deduplicação case-insensitive (preserva o primeiro encontrado)
  const seen = new Set<string>();
  const distinct: string[] = [];
  for (const r of data || []) {
    const raw = r[campo];
    if (!raw) continue;
    const trimmed = (raw as string).trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    distinct.push(trimmed);
  }
  return NextResponse.json(distinct.slice(0, 8));
}
