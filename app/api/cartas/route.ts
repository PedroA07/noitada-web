// app/api/cartas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Recalcula o ranking de todas as cartas após insert/update
async function recalcularRanking() {
  try {
    await supabaseAdmin.rpc('recalcular_ranking_cartas');
  } catch {
    // RPC pode não existir ainda — fallback manual
    const { data: cartas } = await supabaseAdmin
      .from('cartas')
      .select('id, pontuacao')
      .eq('ativa', true)
      .order('pontuacao', { ascending: false });

    if (!cartas) return;
    for (let i = 0; i < cartas.length; i++) {
      await supabaseAdmin
        .from('cartas')
        .update({ ranking: i + 1 })
        .eq('id', cartas[i].id);
    }
  }
}

// Mapa de raridade para ordenação numérica
const RARIDADE_ORDEM: Record<string, number> = {
  comum: 1, incomum: 2, raro: 3, epico: 4, lendario: 5,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get('categoria');
  const genero    = searchParams.get('genero');
  const vinculo   = searchParams.get('vinculo');
  const busca     = searchParams.get('busca');
  const pagina    = parseInt(searchParams.get('pagina') || '1');
  const ordenar   = searchParams.get('ordenar') || 'criado_em';
  const ordemDir  = searchParams.get('ordemDir') === 'asc' ? true : false;
  const porPagina = 20;

  // Coluna de ordenação válida
  const colOrdem = ['criado_em','pontuacao','ranking'].includes(ordenar)
    ? ordenar
    : 'criado_em';

  let query = supabaseAdmin
    .from('cartas')
    .select('*', { count: 'exact' })
    .eq('ativa', true)
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);

  if (categoria) query = query.eq('categoria', categoria);
  if (genero)    query = query.eq('genero', genero);
  if (vinculo)   query = query.ilike('vinculo', `%${vinculo}%`);
  if (busca)     query = query.or(
    `nome.ilike.%${busca}%,personagem.ilike.%${busca}%,vinculo.ilike.%${busca}%`
  );

  // Ordenação especial por raridade (não é uma coluna numérica)
  if (ordenar === 'raridade') {
    // Busca tudo e ordena no servidor
    const { data: todas, error, count } = await query.order('criado_em', { ascending: false });
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    const ORDEM = RARIDADE_ORDEM;
    const sorted = (todas ?? []).sort((a, b) =>
      ordemDir
        ? (ORDEM[a.raridade] ?? 0) - (ORDEM[b.raridade] ?? 0)
        : (ORDEM[b.raridade] ?? 0) - (ORDEM[a.raridade] ?? 0)
    );
    return NextResponse.json({ cartas: sorted.slice((pagina-1)*porPagina, pagina*porPagina), total: count, pagina, porPagina });
  }

  // Ordenação normal por coluna
  query = query.order(colOrdem, { ascending: ordemDir, nullsLast: true });

  // Ranking: nulos vão para o final
  if (colOrdem === 'ranking') {
    query = query.not('ranking', 'is', null);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ cartas: data, total: count, pagina, porPagina });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { personagem, vinculo, categoria, raridade, genero,
            imagem_url, imagens, descricao, criado_por, pontuacao } = body;

    const nome = body.nome || personagem;

    if (!nome || !personagem || !vinculo || !categoria || !raridade || !genero || !criado_por) {
      return NextResponse.json({ erro: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verifica duplicata
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

    // imagens: array de URLs (máx 10), imagem_url = primeira
    const imagensArray = Array.isArray(imagens) ? imagens.slice(0, 10) : (imagem_url ? [imagem_url] : []);
    const primeiraImg  = imagensArray[0] || imagem_url || null;

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .insert({
        nome, personagem, vinculo, categoria, raridade, genero,
        imagem_url: primeiraImg, imagens: imagensArray,
        descricao, criado_por, pontuacao: pontuacao || 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    // Recalcula ranking em background
    recalcularRanking().catch(console.error);

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

    // Sincroniza nome com personagem
    if (campos.personagem && !campos.nome) campos.nome = campos.personagem;

    // Normaliza imagens
    if (Array.isArray(campos.imagens)) {
      campos.imagens = campos.imagens.slice(0, 10);
      if (!campos.imagem_url) campos.imagem_url = campos.imagens[0] || null;
    }

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    // Recalcula ranking se pontuação mudou
    if (campos.pontuacao !== undefined) {
      recalcularRanking().catch(console.error);
    }

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

    recalcularRanking().catch(console.error);
    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}