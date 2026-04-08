// app/api/cartas/route.ts
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
  const genero    = searchParams.get('genero');
  const vinculo   = searchParams.get('vinculo');
  const busca     = searchParams.get('busca');
  const pagina    = parseInt(searchParams.get('pagina') || '1');
  const porPagina = 20;

  let query = supabaseAdmin
    .from('cartas')
    .select('*', { count: 'exact' })
    .eq('ativa', true)
    .order('criado_em', { ascending: false })
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);

  if (categoria) query = query.eq('categoria', categoria);
  if (genero)    query = query.eq('genero', genero);
  if (vinculo)   query = query.ilike('vinculo', `%${vinculo}%`);
  if (busca)     query = query.or(
    `nome.ilike.%${busca}%,personagem.ilike.%${busca}%,vinculo.ilike.%${busca}%`
  );

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  return NextResponse.json({ cartas: data, total: count, pagina, porPagina });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      personagem, vinculo, categoria, raridade, genero,
      imagem_url, imagem_r2_key, descricao, criado_por, pontuacao,
    } = body;

    // nome = personagem (campo unificado)
    const nome = body.nome || personagem;

    if (!nome || !personagem || !vinculo || !categoria || !raridade || !genero || !criado_por) {
      return NextResponse.json({ erro: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verifica duplicata: mesmo personagem no mesmo vínculo
    const { data: existente } = await supabaseAdmin
      .from('cartas')
      .select('id')
      .ilike('personagem', personagem.trim())
      .ilike('vinculo', vinculo.trim())
      .eq('ativa', true)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { erro: `Já existe uma carta de "${personagem}" no vínculo "${vinculo}".` },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .insert({
        nome, personagem, vinculo, categoria, raridade, genero,
        imagem_url, imagem_r2_key, descricao, criado_por, pontuacao,
      })
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

    // Se está atualizando personagem ou vínculo, sincroniza nome
    if (campos.personagem && !campos.nome) {
      campos.nome = campos.personagem;
    }

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