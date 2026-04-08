// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Thresholds baseados em page views mensais do Wikipedia
// Naruto       → ~500K-1M views/mês  → lendário
// Char famoso  → ~100K-500K          → épico
// Char médio   → ~20K-100K           → raro
// Char nicho   → ~2K-20K             → incomum
// Desconhecido → <2K                 → comum
function calcularRaridade(views: number): string {
  if (views >= 500_000) return 'lendario';
  if (views >= 100_000) return 'epico';
  if (views >= 20_000)  return 'raro';
  if (views >= 2_000)   return 'incomum';
  return 'comum';
}

async function buscarWikipedia(personagem: string, vinculo: string): Promise<{ raridade: string; total: number; fonte: string }> {
  // Tenta com personagem+vínculo primeiro, depois só personagem
  const termos = vinculo
    ? [`${personagem} ${vinculo}`, personagem]
    : [personagem];

  for (const termo of termos) {
    try {
      // 1. Busca o artigo
      const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`;
      const res = await fetch(searchUrl);
      if (!res.ok) continue;

      const data = await res.json() as { query?: { search?: { title: string }[] } };
      const hit  = data?.query?.search?.[0];
      if (!hit) {
        // Tenta inglês se não achou em português
        const resEn = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`);
        if (!resEn.ok) continue;
        const dataEn = await resEn.json() as { query?: { search?: { title: string }[] } };
        const hitEn  = dataEn?.query?.search?.[0];
        if (!hitEn) continue;

        // Busca views em inglês
        const titulo   = encodeURIComponent(hitEn.title.replace(/ /g, '_'));
        const viewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${titulo}/monthly/20240101/20241201`;
        const resV = await fetch(viewsUrl);
        if (!resV.ok) continue;
        const vd = await resV.json() as { items?: { views: number }[] };
        const totalViews = vd?.items?.reduce((s, i) => s + (i.views || 0), 0) ?? 0;
        const mediaViews = Math.round(totalViews / 12);
        if (mediaViews > 0) {
          const raridade = calcularRaridade(mediaViews);
          console.log(`[wiki/en] "${hitEn.title}" → ${mediaViews.toLocaleString()} views/mês → ${raridade}`);
          return { raridade, total: mediaViews, fonte: 'wikipedia' };
        }
        continue;
      }

      // 2. Busca views em português
      const titulo   = encodeURIComponent(hit.title.replace(/ /g, '_'));
      const viewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia/all-access/all-agents/${titulo}/monthly/20240101/20241201`;
      const resV = await fetch(viewsUrl);

      if (resV.ok) {
        const vd = await resV.json() as { items?: { views: number }[] };
        const totalViews = vd?.items?.reduce((s, i) => s + (i.views || 0), 0) ?? 0;
        const mediaViews = Math.round(totalViews / 12);
        if (mediaViews > 0) {
          const raridade = calcularRaridade(mediaViews);
          console.log(`[wiki/pt] "${hit.title}" → ${mediaViews.toLocaleString()} views/mês → ${raridade}`);
          return { raridade, total: mediaViews, fonte: 'wikipedia' };
        }
      }

      // 3. Sem views PT → tenta EN para o mesmo título
      const viewsEnUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${titulo}/monthly/20240101/20241201`;
      const resVEn = await fetch(viewsEnUrl);
      if (resVEn.ok) {
        const vd = await resVEn.json() as { items?: { views: number }[] };
        const totalViews = vd?.items?.reduce((s, i) => s + (i.views || 0), 0) ?? 0;
        const mediaViews = Math.round(totalViews / 12);
        if (mediaViews > 0) {
          const raridade = calcularRaridade(mediaViews);
          console.log(`[wiki/en-fallback] "${hit.title}" → ${mediaViews.toLocaleString()} views/mês → ${raridade}`);
          return { raridade, total: mediaViews, fonte: 'wikipedia' };
        }
      }
    } catch (err: any) {
      console.error(`[wiki] erro para "${termo}":`, err?.message);
    }
  }

  return { raridade: 'comum', total: 0, fonte: 'wikipedia' };
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

  const resultado = await buscarWikipedia(personagem, vinculo);
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}