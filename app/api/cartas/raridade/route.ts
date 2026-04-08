// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Todos os idiomas do Wikipedia que valem a pena somar
// (os maiores em termos de tráfego global)
const LINGUAS_WIKI = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ru', 'zh', 'ko', 'ar', 'pl'];

// Thresholds baseados na SOMA de views de todos os idiomas
// Naruto (EN ~800K + PT ~50K + JA ~300K + ...) → soma ~2M+/mês → lendário
// Char famoso → ~200K-1M soma                              → épico
// Char médio  → ~20K-200K soma                             → raro
// Char nicho  → ~2K-20K soma                               → incomum
// Desconhecido → <2K soma                                  → comum
function calcularRaridade(totalViews: number): string {
  if (totalViews >= 1_000_000) return 'lendario';
  if (totalViews >= 200_000)   return 'epico';
  if (totalViews >= 20_000)    return 'raro';
  if (totalViews >= 2_000)     return 'incomum';
  return 'comum';
}

// Busca o título do artigo em um idioma
async function buscarTitulo(termo: string, lang: string): Promise<string | null> {
  try {
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
    if (!res.ok) return null;
    const data = await res.json() as { query?: { search?: { title: string; snippet: string }[] } };
    const hit = data?.query?.search?.[0];
    if (!hit) return null;
    // Filtra resultados irrelevantes (ex: buscar "Naruto" e achar "Lista de episódios")
    const tituloLower = hit.title.toLowerCase();
    const termoLower  = termo.toLowerCase().split(' ')[0];
    if (!tituloLower.includes(termoLower) && !hit.snippet.toLowerCase().includes(termoLower)) return null;
    return hit.title;
  } catch { return null; }
}

// Busca a média mensal de views de um artigo
async function buscarViews(titulo: string, lang: string): Promise<number> {
  try {
    const t   = encodeURIComponent(titulo.replace(/ /g, '_'));
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents/${t}/monthly/20230101/20241201`;
    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined });
    if (!res.ok) return 0;
    const data = await res.json() as { items?: { views: number }[] };
    const items = data?.items ?? [];
    if (!items.length) return 0;
    const total = items.reduce((s, i) => s + (i.views || 0), 0);
    return Math.round(total / items.length); // média mensal
  } catch { return 0; }
}

// Busca views em um idioma (título + views em paralelo)
async function buscarIdiomaCompleto(termo: string, lang: string): Promise<number> {
  const titulo = await buscarTitulo(termo, lang);
  if (!titulo) return 0;
  const views = await buscarViews(titulo, lang);
  if (views > 0) console.log(`[wiki/${lang}] "${titulo}" → ${views.toLocaleString()} views/mês`);
  return views;
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
    return NextResponse.json({
      raridade: cached.raridade,
      total:    cached.total,
      fonte:    cached.fonte,
      cache:    true,
    });
  }

  // Melhor termo de busca: personagem + vínculo juntos
  const termoPrincipal   = vinculo ? `${personagem} ${vinculo}` : personagem;
  const termoSecundario  = personagem; // fallback só com o nome

  console.log(`[raridade] buscando: "${termoPrincipal}" em ${LINGUAS_WIKI.length} idiomas`);

  // Busca todos os idiomas em paralelo com o termo principal
  const viewsPorIdioma = await Promise.all(
    LINGUAS_WIKI.map(lang => buscarIdiomaCompleto(termoPrincipal, lang))
  );

  let somaViews = viewsPorIdioma.reduce((s, v) => s + v, 0);

  // Se não encontrou nada com o termo principal, tenta só o nome do personagem
  if (somaViews === 0 && vinculo) {
    console.log(`[raridade] sem resultado para "${termoPrincipal}", tentando só "${termoSecundario}"`);
    const viewsSecundario = await Promise.all(
      LINGUAS_WIKI.map(lang => buscarIdiomaCompleto(termoSecundario, lang))
    );
    somaViews = viewsSecundario.reduce((s, v) => s + v, 0);
  }

  const raridade = calcularRaridade(somaViews);

  console.log(`[raridade] TOTAL "${termoPrincipal}" → ${somaViews.toLocaleString()} views/mês (soma) → ${raridade}`);

  const resultado = { raridade, total: somaViews, fonte: 'wikipedia' };
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}