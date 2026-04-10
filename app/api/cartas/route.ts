// app/api/cartas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function recalcularRanking() {
  try {
    await supabaseAdmin.rpc('recalcular_ranking_cartas');
  } catch {
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

const RARIDADE_ORDEM: Record<string, number> = {
  comum: 1, incomum: 2, raro: 3, epico: 4, lendario: 5,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria       = searchParams.get('categoria');
  const genero          = searchParams.get('genero');
  const vinculo         = searchParams.get('vinculo');
  const busca           = searchParams.get('busca');
  const pagina          = parseInt(searchParams.get('pagina') || '1');
  const ordenar         = searchParams.get('ordenar') || 'criado_em';
  const ordemDir        = searchParams.get('ordemDir') === 'asc' ? true : false;
  const soPrincipais    = searchParams.get('so_principais') === 'true';
  const principalIds    = searchParams.get('principal_ids'); // IDs separados por vírgula
  const porPagina       = 20;

  const colOrdem = ['criado_em', 'pontuacao', 'ranking'].includes(ordenar)
    ? ordenar
    : 'criado_em';

  let query = supabaseAdmin
    .from('cartas')
    .select('*', { count: 'exact' })
    .eq('ativa', true)
    .range((pagina - 1) * porPagina, pagina * porPagina - 1);

  if (soPrincipais)   query = query.is('carta_principal_id', null);
  if (principalIds) {
    const ids = principalIds.split(',').filter(Boolean);
    if (ids.length > 0) {
      // Busca todas as variações dessas cartas (sem paginação)
      const { data, error } = await supabaseAdmin
        .from('cartas')
        .select('*')
        .eq('ativa', true)
        .in('carta_principal_id', ids)
        .order('variacao_ordem', { ascending: true });
      if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
      return NextResponse.json({ cartas: data ?? [], total: data?.length ?? 0 });
    }
  }

  if (categoria) query = query.eq('categoria', categoria);
  if (genero)    query = query.eq('genero', genero);
  if (vinculo)   query = query.ilike('vinculo', `%${vinculo}%`);
  if (busca)     query = query.or(
    `nome.ilike.%${busca}%,personagem.ilike.%${busca}%,vinculo.ilike.%${busca}%`
  );

  if (ordenar === 'raridade') {
    const { data: todas, error, count } = await query.order('criado_em', { ascending: false });
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
    const ORDEM = RARIDADE_ORDEM;
    const sorted = (todas ?? []).sort((a, b) =>
      ordemDir
        ? (ORDEM[a.raridade] ?? 0) - (ORDEM[b.raridade] ?? 0)
        : (ORDEM[b.raridade] ?? 0) - (ORDEM[a.raridade] ?? 0)
    );
    return NextResponse.json({ cartas: sorted.slice((pagina - 1) * porPagina, pagina * porPagina), total: count, pagina, porPagina });
  }

  query = query.order(colOrdem, { ascending: ordemDir, nullsFirst: false });

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ cartas: data, total: count, pagina, porPagina });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      personagem, vinculo, sub_vinculo, categoria, raridade, genero,
      imagem_url, imagens, descricao, criado_por, pontuacao,
      imagem_offset_x, imagem_offset_y, imagem_zoom,
      carta_principal_id,
    } = body;

    const nome = body.nome || personagem;

    if (!nome || !personagem || !vinculo || !categoria || !raridade || !genero || !criado_por) {
      return NextResponse.json({ erro: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Só verifica duplicata para cartas principais (sem carta_principal_id)
    if (!carta_principal_id) {
      const { data: existente } = await supabaseAdmin
        .from('cartas')
        .select('id')
        .ilike('personagem', personagem.trim())
        .ilike('vinculo', vinculo.trim())
        .is('carta_principal_id', null)
        .eq('ativa', true)
        .maybeSingle();

      if (existente) {
        return NextResponse.json(
          { erro: `Já existe uma carta principal de "${personagem}" no vínculo "${vinculo}". Para criar uma variação, vincule à carta principal existente.` },
          { status: 409 }
        );
      }
    }

    // Se é variação, calcula próxima ordem
    let variacao_ordem = 0;
    if (carta_principal_id) {
      const { data: ultimaVar } = await supabaseAdmin
        .from('cartas')
        .select('variacao_ordem')
        .eq('carta_principal_id', carta_principal_id)
        .eq('ativa', true)
        .order('variacao_ordem', { ascending: false })
        .limit(1)
        .maybeSingle();
      variacao_ordem = (ultimaVar?.variacao_ordem ?? 0) + 1;
    }

    const imagensArray = Array.isArray(imagens) ? imagens.slice(0, 10) : (imagem_url ? [imagem_url] : []);
    const primeiraImg  = imagensArray[0] || imagem_url || null;

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .insert({
        nome, personagem, vinculo,
        sub_vinculo: sub_vinculo || null,
        categoria, raridade, genero,
        imagem_url: primeiraImg, imagens: imagensArray,
        descricao, criado_por, pontuacao: pontuacao || 0,
        imagem_offset_x: imagem_offset_x ?? 50,
        imagem_offset_y: imagem_offset_y ?? 50,
        imagem_zoom:     imagem_zoom     ?? 100,
        carta_principal_id: carta_principal_id || null,
        variacao_ordem,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

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

    if (campos.personagem && !campos.nome) campos.nome = campos.personagem;

    if (Array.isArray(campos.imagens)) {
      campos.imagens = campos.imagens.slice(0, 10);
      if (!campos.imagem_url) campos.imagem_url = campos.imagens[0] || null;
    }
    if (campos.imagem_offset_x === undefined) delete campos.imagem_offset_x;
    if (campos.imagem_offset_y === undefined) delete campos.imagem_offset_y;
    if (campos.imagem_zoom     === undefined) delete campos.imagem_zoom;

    // Normaliza sub_vinculo
    if ('sub_vinculo' in campos && !campos.sub_vinculo) campos.sub_vinculo = null;

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    if (campos.pontuacao !== undefined) {
      recalcularRanking().catch(console.error);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, campos } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ erro: 'Lista de IDs obrigatória' }, { status: 400 });
    }
    if (!campos || typeof campos !== 'object') {
      return NextResponse.json({ erro: 'Campos obrigatórios' }, { status: 400 });
    }

    // Normaliza strings
    if ('vinculo' in campos && campos.vinculo) campos.vinculo = (campos.vinculo as string).trim();
    if ('sub_vinculo' in campos) campos.sub_vinculo = campos.sub_vinculo ? (campos.sub_vinculo as string).trim() || null : null;

    const { error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
      .in('id', ids);

    if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

    return NextResponse.json({ sucesso: true, atualizadas: ids.length });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ erro: 'ID obrigatório' }, { status: 400 });

    // Desativa também as variações desta carta
    await supabaseAdmin
      .from('cartas')
      .update({ ativa: false })
      .eq('carta_principal_id', id);

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
