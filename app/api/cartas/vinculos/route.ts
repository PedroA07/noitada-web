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

  const valores = (data || []).map((r: any) => r[campo]).filter(Boolean) as string[];
  const seen = new Set<string>();
  const distinct = valores.filter(v => { if(seen.has(v)) return false; seen.add(v); return true; });
  return NextResponse.json(distinct.slice(0, 8));
}
