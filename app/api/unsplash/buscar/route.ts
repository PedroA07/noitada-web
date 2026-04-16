import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey)
    return NextResponse.json({ erro: 'UNSPLASH_ACCESS_KEY não configurada' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const page  = searchParams.get('page') || '1';

  if (!query.trim())
    return NextResponse.json({ results: [] });

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=12&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
      cache: 'no-store',
    });

    if (!res.ok)
      return NextResponse.json({ erro: `Unsplash retornou ${res.status}` }, { status: res.status });

    const dados = await res.json();

    // Retorna só o que precisamos (evita vazar dados sensíveis desnecessários)
    const results = (dados.results ?? []).map((foto: any) => ({
      id:       foto.id,
      small:    foto.urls.small,
      regular:  foto.urls.regular,
      full:     foto.urls.full,
      thumb:    foto.urls.thumb,
      alt:      foto.alt_description || foto.description || '',
      autor:    foto.user?.name || '',
      autorUrl: foto.user?.links?.html || '',
    }));

    return NextResponse.json({ results, total: dados.total_pages });
  } catch {
    return NextResponse.json({ erro: 'Erro ao buscar imagens.' }, { status: 500 });
  }
}
