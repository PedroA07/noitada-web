import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria');
  const vinculo = searchParams.get('vinculo');
  const busca = searchParams.get('busca');
  const pagina = parseInt(searchParams.get('pagina') || '1');
  const porPagina = 20;

  let query = supabaseAdmin
    .from('cartas')
    .select('*', { count: 'exact' })
    .eq('ativa', true)
    .order('criado_em', { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);

  if (categoria) query = query.eq('categoria', categoria);
  if (vinculo) query = query.ilike('vinculo', `%${vinculo}%`);
  if (busca) query = query.or(
    `nome.ilike.%${busca}%,personagem.ilike.%${busca}%,vinculo.ilike.%${busca}%`
  );

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ cartas: data, total: count, pagina, porPagina });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, personagem, vinculo, categoria, raridade, imagem_url, descricao, criado_por } = body;

    if (!nome || !personagem || !vinculo || !categoria || !raridade || !criado_por) {
      return NextResponse.json({ erro: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .insert({ nome, personagem, vinculo, categoria, raridade, imagem_url, descricao, criado_por })
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...campos } = body;

    if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
      .eq('id', id)
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
      .from('cartas')
      .update({ ativa: false })
      .eq('id', id);

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}