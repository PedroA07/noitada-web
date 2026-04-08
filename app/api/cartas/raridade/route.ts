// app/api/cartas/raridade/route.ts
// Busca popularidade em múltiplas fontes abertas e sem custo:
// Wikipedia (12 idiomas) + Wikidata (score de popularidade) + Open Library + MusicBrainz
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Idiomas do Wikipedia para buscar em paralelo
const LINGUAS_WIKI = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ru', 'zh', 'ko', 'ar', 'pl'];

// Thresholds baseados na soma ponderada de todas as fontes
// Thresholds baseados na soma ponderada de todas as fontes:
// Naruto, Goku, Batman, Spider-Man → 1M+  → lendário
// Personagens muito famosos        → 300K+ → épico
// Personagens conhecidos           → 50K+  → raro
// Personagens de nicho             → 5K+   → incomum
// Desconhecidos                    → <5K   → comum
function calcularRaridade(score: number): string {
  if (score >= 1_000_000) return 'lendario';
  if (score >= 500_000)   return 'epico';
  if (score >= 250_000)   return 'raro';
  if (score >= 50_000)    return 'incomum';
  return 'comum';
}

// ─── Wikipedia: busca título e views médias mensais ───────────────────────────
async function wikiViews(termo: string, lang: string): Promise<number> {
  try {
    const searchRes = await fetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`
    );
    if (!searchRes.ok) return 0;
    const searchData = await searchRes.json() as { query?: { search?: { title: string }[] } };
    const titulo = searchData?.query?.search?.[0]?.title;
    if (!titulo) return 0;

    const t = encodeURIComponent(titulo.replace(/ /g, '_'));
    const viewsRes = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents/${t}/monthly/20230101/20241201`
    );
    if (!viewsRes.ok) return 0;
    const viewsData = await viewsRes.json() as { items?: { views: number }[] };
    const items = viewsData?.items ?? [];
    if (!items.length) return 0;
    return Math.round(items.reduce((s, i) => s + i.views, 0) / items.length);
  } catch { return 0; }
}

// ─── Wikidata: sitelinks count (quantos Wikipedias têm página sobre o tema) ───
// Personagens/obras muito famosos aparecem em dezenas de Wikipedias
// Multiplica por 5000 para equiparar com a escala de views
async function wikidataScore(termo: string): Promise<number> {
  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(termo)}&language=pt&format=json&limit=1&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json() as { search?: { id: string }[] };
    const entityId = data?.search?.[0]?.id;
    if (!entityId) return 0;

    // Busca quantos sitelinks (artigos em outros Wikipedias) essa entidade tem
    const entityRes = await fetch(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=sitelinks&format=json&origin=*`
    );
    if (!entityRes.ok) return 0;
    const entityData = await entityRes.json() as { entities?: Record<string, { sitelinks?: Record<string, unknown> }> };
    const sitelinks = entityData?.entities?.[entityId]?.sitelinks ?? {};
    const count = Object.keys(sitelinks).length;
    console.log(`[wikidata] "${termo}" → ${entityId} → ${count} sitelinks`);
    return count * 5_000; // cada sitelink vale 5K views
  } catch { return 0; }
}

// ─── Open Library: número de edições de um livro ──────────────────────────────
// Muito útil para HQs, mangás e livros
// Cada edição vale 2000 pontos
async function openLibraryScore(termo: string): Promise<number> {
  try {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=1&fields=edition_count,ratings_count`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json() as { docs?: { edition_count?: number; ratings_count?: number }[] };
    const doc = data?.docs?.[0];
    if (!doc) return 0;
    const editions = doc.edition_count ?? 0;
    const ratings  = doc.ratings_count ?? 0;
    const score    = (editions * 2_000) + (ratings * 100);
    console.log(`[openlibrary] "${termo}" → ${editions} edições, ${ratings} ratings → score ${score}`);
    return score;
  } catch { return 0; }
}

// ─── MusicBrainz: para músicos e bandas ──────────────────────────────────────
// Tags count e score próprio do MB
async function musicBrainzScore(termo: string): Promise<number> {
  try {
    const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(termo)}&fmt=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NoitadaBot/1.0 (noitadaserver.com.br)' } });
    if (!res.ok) return 0;
    const data = await res.json() as { artists?: { score?: number; tags?: { count: number }[] }[] };
    const artist = data?.artists?.[0];
    if (!artist) return 0;
    const mbScore    = artist.score ?? 0; // 0-100
    const tagsTotal  = artist.tags?.reduce((s, t) => s + t.count, 0) ?? 0;
    const score      = (mbScore * 3_000) + (tagsTotal * 500);
    console.log(`[musicbrainz] "${termo}" → score ${mbScore}, tags ${tagsTotal} → ${score}`);
    return score;
  } catch { return 0; }
}

// ─── OMDB (filmes/séries sem chave — modo público limitado) ───────────────────
async function omdbScore(termo: string): Promise<number> {
  try {
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(termo)}&apikey=trilogy`;
    const res = await fetch(url);
    if (!res.ok) return 0;
    const data = await res.json() as { Search?: { imdbID: string }[]; totalResults?: string };
    const total = parseInt(data?.totalResults ?? '0', 10);
    const score = total * 10_000;
    if (total > 0) console.log(`[omdb] "${termo}" → ${total} resultados → score ${score}`);
    return score;
  } catch { return 0; }
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

  // Estratégia de busca:
  // SEMPRE busca "personagem + vínculo" juntos para garantir contexto correto.
  // Ex: "Rafael" + "Tartarugas Ninjas" → busca "Rafael Tartarugas Ninjas"
  // Isso evita achar o Rafael errado, o Naruto de outro contexto, etc.
  // Fallback: se não achar nada com os dois juntos, tenta só o vínculo
  // (pega a popularidade da franquia como proxy).
  const termoCompleto = vinculo ? `${personagem} ${vinculo}` : personagem;
  const termoFallback = vinculo; // fallback é a franquia/obra, não o personagem sozinho

  console.log(`[raridade] buscando: "${termoCompleto}"`);

  const [
    viewsWiki,
    scoreWikidata,
    scoreOpenLib,
    scoreMusicBrainz,
    scoreOmdb,
  ] = await Promise.all([
    // Wikipedia — "Rafael Tartarugas Ninjas", fallback "Tartarugas Ninjas"
    Promise.all(LINGUAS_WIKI.map(lang => wikiViews(termoCompleto, lang)))
      .then(async views => {
        const soma = views.reduce((s, v) => s + v, 0);
        if (soma === 0 && termoFallback) {
          const v2 = await Promise.all(LINGUAS_WIKI.map(lang => wikiViews(termoFallback, lang)));
          return v2.reduce((s, v) => s + v, 0);
        }
        return soma;
      }),

    // Wikidata — "Rafael Tartarugas Ninjas", fallback "Tartarugas Ninjas"
    wikidataScore(termoCompleto)
      .then(s => (s > 0 || !termoFallback) ? s : wikidataScore(termoFallback)),

    // Open Library — "Rafael Tartarugas Ninjas", fallback "Tartarugas Ninjas"
    openLibraryScore(termoCompleto)
      .then(s => (s > 0 || !termoFallback) ? s : openLibraryScore(termoFallback)),

    // MusicBrainz — "Rafael Tartarugas Ninjas" (nome do artista/banda com contexto)
    // fallback só vínculo (pode ser nome de banda/álbum)
    musicBrainzScore(termoCompleto)
      .then(s => (s > 0 || !termoFallback) ? s : musicBrainzScore(termoFallback)),

    // OMDB — "Rafael Tartarugas Ninjas", fallback "Tartarugas Ninjas"
    omdbScore(termoCompleto)
      .then(s => (s > 0 || !termoFallback) ? s : omdbScore(termoFallback)),
  ]);

  // Score total ponderado
  const scoreTotal = viewsWiki + scoreWikidata + scoreOpenLib + scoreMusicBrainz + scoreOmdb;
  const raridade   = calcularRaridade(scoreTotal);

  console.log(`[raridade] RESULTADO "${termoCompleto}" (fallback: "${termoFallback||'none'}"):
    Wikipedia:    ${viewsWiki.toLocaleString('pt-BR')}
    Wikidata:     ${scoreWikidata.toLocaleString('pt-BR')}
    Open Library: ${scoreOpenLib.toLocaleString('pt-BR')}
    MusicBrainz:  ${scoreMusicBrainz.toLocaleString('pt-BR')}
    OMDB:         ${scoreOmdb.toLocaleString('pt-BR')}
    TOTAL:        ${scoreTotal.toLocaleString('pt-BR')} → ${raridade}`);

  const resultado = { raridade, total: scoreTotal, fonte: 'multi' };
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}