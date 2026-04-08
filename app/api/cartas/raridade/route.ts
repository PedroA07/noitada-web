// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function calcularRaridade(total: number): string {
  if (total >= 500_000_000) return 'lendario';
  if (total >= 100_000_000) return 'epico';
  if (total >= 10_000_000)  return 'raro';
  if (total >= 1_000_000)   return 'incomum';
  return 'comum';
}

// ── Fonte 1: Google Custom Search ─────────────────────────────────────────────
async function buscarGoogle(personagem: string, vinculo: string): Promise<{ total: number } | null> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;
  if (!apiKey || !cx) return null;

  try {
    // Busca com site:pt.wikipedia.org para garantir resultados do universo certo
    const query = encodeURIComponent(`${personagem}${vinculo ? ' ' + vinculo : ''}`);
    const url   = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=1`;
    const res   = await fetch(url, { cache: 'no-store' });

    if (res.status === 429) return null; // quota esgotada
    if (!res.ok) return null;

    const data = await res.json() as { searchInformation?: { totalResults?: string } };
    const total = parseInt(data?.searchInformation?.totalResults || '0', 10);
    return { total };
  } catch {
    return null;
  }
}

// ── Fonte 2: Wikipedia Pageviews API (sem key, muito confiável) ───────────────
// Retorna views/mês do artigo da Wikipedia. Muito popular = muitas views.
async function buscarWikipedia(personagem: string): Promise<{ total: number } | null> {
  try {
    // Normaliza o nome para o formato da Wikipedia (snake_case)
    const titulo = encodeURIComponent(personagem.trim().replace(/\s+/g, '_'));

    // Busca pageviews dos últimos 30 dias
    const hoje   = new Date();
    const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - 30);
    const fmt    = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');

    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia/all-access/all-agents/${titulo}/daily/${fmt(inicio)}/${fmt(hoje)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NoitadaBot/1.0 (noitadaserver.com.br)' },
      cache: 'no-store',
    });

    if (res.status === 404) {
      // Tenta na Wikipedia em inglês
      const urlEn = url.replace('pt.wikipedia', 'en.wikipedia');
      const resEn = await fetch(urlEn, {
        headers: { 'User-Agent': 'NoitadaBot/1.0 (noitadaserver.com.br)' },
        cache: 'no-store',
      });
      if (!resEn.ok) return null;
      const dataEn = await resEn.json() as { items?: { views: number }[] };
      const totalEn = (dataEn.items || []).reduce((s, i) => s + i.views, 0);
      // Converte views/mês em "resultados equivalentes" para usar a mesma escala
      return { total: totalEn * 5_000 };
    }

    if (!res.ok) return null;

    const data = await res.json() as { items?: { views: number }[] };
    const totalViews = (data.items || []).reduce((s, i) => s + i.views, 0);
    // Multiplica para escalar à mesma grandeza que resultados do Google
    return { total: totalViews * 5_000 };
  } catch {
    return null;
  }
}

// ── Fonte 3: Wikipedia Search — busca o artigo mais próximo e pega seus views ─
async function buscarWikipediaSearch(personagem: string, vinculo: string): Promise<{ total: number } | null> {
  try {
    const query = encodeURIComponent(`${personagem}${vinculo ? ' ' + vinculo : ''}`);
    const url   = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&srlimit=1&format=json&origin=*`;
    const res   = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data  = await res.json() as { query?: { searchinfo?: { totalhits?: number }; search?: { title: string }[] } };
    const hits  = data?.query?.searchinfo?.totalhits || 0;
    const titulo = data?.query?.search?.[0]?.title;

    // Se encontrou artigo, busca os pageviews dele
    if (titulo) {
      const views = await buscarWikipedia(titulo);
      if (views) return views;
    }

    // Fallback: usa totalhits como proxy de popularidade
    return { total: hits * 100_000 };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = searchParams.get('personagem')?.trim();
  const vinculo    = searchParams.get('vinculo')?.trim() || '';

  if (!personagem) {
    return NextResponse.json({ erro: 'Parâmetro "personagem" obrigatório' }, { status: 400 });
  }

  const chave = `${personagem}:${vinculo}`.toLowerCase();
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({ raridade: cached.raridade, total: cached.total, fonte: cached.fonte, cache: true });
  }

  let resultado: { total: number } | null = null;
  let fonte = 'desconhecida';

  // Tenta Google primeiro (mais preciso)
  resultado = await buscarGoogle(personagem, vinculo);
  if (resultado && resultado.total > 0) {
    fonte = 'google';
  }

  // Se Google não retornou nada útil, tenta Wikipedia direto
  if (!resultado || resultado.total === 0) {
    resultado = await buscarWikipedia(personagem);
    if (resultado && resultado.total > 0) fonte = 'wikipedia';
  }

  // Se ainda não achou, tenta busca na Wikipedia
  if (!resultado || resultado.total === 0) {
    resultado = await buscarWikipediaSearch(personagem, vinculo);
    if (resultado && resultado.total > 0) fonte = 'wikipedia-search';
  }

  const total    = resultado?.total || 0;
  const raridade = calcularRaridade(total);

  console.log(`🔍 Raridade [${personagem} / ${vinculo || '-'}] via ${fonte}: ${total.toLocaleString()} → ${raridade}`);

  cache.set(chave, { raridade, total, fonte, expira: Date.now() + CACHE_TTL });

  return NextResponse.json({
    raridade,
    total,
    fonte,
    cache: false,
    sem_api: !process.env.GOOGLE_API_KEY,
  });
}