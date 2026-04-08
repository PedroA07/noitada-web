// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function calcularRaridade(total: number): string {
  if (total >= 200_000_000) return 'lendario';
  if (total >= 30_000_000)  return 'epico';
  if (total >= 3_000_000)   return 'raro';
  if (total >= 300_000)     return 'incomum';
  return 'comum';
}

// ─── Fallback Wikipedia ───────────────────────────────────────────────────────
// Busca o número de visualizações do artigo no Wikipedia como proxy de popularidade
async function buscarWikipedia(personagem: string, vinculo: string): Promise<{ raridade: string; total: number; fonte: string }> {
  try {
    // Tenta buscar o artigo pelo nome do personagem + vínculo
    const termos = [
      `${personagem} ${vinculo}`,
      personagem,
    ];

    for (const termo of termos) {
      const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`;
      const res = await fetch(searchUrl);
      if (!res.ok) continue;

      const data = await res.json() as { query?: { search?: { title: string; snippet: string }[] } };
      const resultado = data?.query?.search?.[0];
      if (!resultado) continue;

      // Busca visualizações dos últimos 30 dias do artigo encontrado
      const titulo = encodeURIComponent(resultado.title.replace(/ /g, '_'));
      const viewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia/all-access/all-agents/${titulo}/monthly/20240101/20241201`;
      const resViews = await fetch(viewsUrl);

      if (resViews.ok) {
        const viewsData = await resViews.json() as { items?: { views: number }[] };
        const totalViews = viewsData?.items?.reduce((s, i) => s + (i.views || 0), 0) ?? 0;

        // Wikipedia views tem escala diferente — thresholds ajustados
        // Naruto → ~5M views/mês × 12 = 60M → lendário
        // Ajustamos: multiplica por 6 para equiparar com Google resultados
        const totalEquivalente = totalViews * 6;
        const raridade = calcularRaridade(totalEquivalente);

        console.log(`[raridade/wiki] "${termo}" → ${totalViews.toLocaleString()} views → ${raridade}`);
        return { raridade, total: totalViews, fonte: 'wikipedia' };
      }

      // Sem views → usa contagem de resultados de busca como proxy
      const searchTotal = data?.query?.search?.length ?? 0;
      if (searchTotal > 0) {
        return { raridade: 'incomum', total: searchTotal, fonte: 'wikipedia-search' };
      }
    }
  } catch (err: any) {
    console.error('[raridade/wiki] erro:', err?.message);
  }

  return { raridade: 'comum', total: 0, fonte: 'wikipedia' };
}

// ─── Google Custom Search ─────────────────────────────────────────────────────
async function buscarGoogle(personagem: string, vinculo: string, apiKey: string, cx: string): Promise<{ raridade: string; total: number; fonte: string } | null> {
  const queryStr = vinculo ? `${personagem} ${vinculo}` : personagem;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(queryStr)}&num=1&fields=searchInformation(totalResults)`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    const bodyText = await res.text();
    console.log(`[raridade/google] status=${res.status} "${queryStr}" body=${bodyText.slice(0, 200)}`);

    if (!res.ok) return null;

    const data  = JSON.parse(bodyText) as { searchInformation?: { totalResults?: string } };
    const total = parseInt(data?.searchInformation?.totalResults ?? '0', 10) || 0;
    return { raridade: calcularRaridade(total), total, fonte: 'google' };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = (searchParams.get('personagem') ?? '').trim();
  const vinculo    = (searchParams.get('vinculo')    ?? '').trim();

  if (personagem.length < 2) {
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'invalido' }, { status: 400 });
  }

  const chave  = `${personagem}:${vinculo}`.toLowerCase();
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({ raridade: cached.raridade, total: cached.total, fonte: cached.fonte, cache: true });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;

  let resultado: { raridade: string; total: number; fonte: string } | null = null;

  // 1. Tenta Google se configurado
  if (apiKey && cx) {
    resultado = await buscarGoogle(personagem, vinculo, apiKey, cx);
  }

  // 2. Fallback Wikipedia se Google falhou ou não configurado
  if (!resultado) {
    console.log(`[raridade] usando Wikipedia como fallback para "${personagem}"`);
    resultado = await buscarWikipedia(personagem, vinculo);
  }

  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}