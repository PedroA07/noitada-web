// app/api/cartas/raridade/route.ts
// Busca popularidade em múltiplas fontes abertas e gratuitas em paralelo
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Idiomas Wikipedia
const LINGUAS_WIKI = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ru', 'zh', 'ko', 'ar', 'pl'];

// Thresholds soma ponderada de todas as fontes
function calcularRaridade(score: number): string {
  if (score >= 1_000_000) return 'lendario';
  if (score >= 500_000)   return 'epico';
  if (score >= 250_000)   return 'raro';
  if (score >= 50_000)    return 'incomum';
  return 'comum';
}

// Fetch com timeout
async function fetchJson(url: string, opts: RequestInit = {}): Promise<any> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    try {
      const res = await fetch(url, { ...opts, signal: ctrl.signal });
      if (!res.ok) return null;
      return await res.json();
    } finally { clearTimeout(t); }
  } catch { return null; }
}

// ─── Wikipedia (12 idiomas) ───────────────────────────────────────────────────
async function wikiViews(termo: string, lang: string): Promise<number> {
  const search = await fetchJson(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`);
  const titulo = search?.query?.search?.[0]?.title;
  if (!titulo) return 0;
  const t = encodeURIComponent(titulo.replace(/ /g, '_'));
  const views = await fetchJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents/${t}/monthly/20230101/20241201`);
  const items: any[] = views?.items ?? [];
  if (!items.length) return 0;
  return Math.round(items.reduce((s, i) => s + i.views, 0) / items.length);
}

// ─── Wikidata (presença global) ───────────────────────────────────────────────
async function wikidataScore(termo: string): Promise<number> {
  const search = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(termo)}&language=pt&format=json&limit=1&origin=*`);
  const id = search?.search?.[0]?.id;
  if (!id) return 0;
  const entity = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=sitelinks&format=json&origin=*`);
  return Object.keys(entity?.entities?.[id]?.sitelinks ?? {}).length * 5_000;
}

// ─── Jikan/MyAnimeList (anime + manga) ───────────────────────────────────────
async function jikanScore(termo: string): Promise<number> {
  const [anime, manga] = await Promise.all([
    fetchJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(termo)}&limit=1&order_by=members&sort=desc`),
    fetchJson(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(termo)}&limit=1&order_by=members&sort=desc`),
  ]);
  const animeM = anime?.data?.[0]?.members ?? 0;
  const mangaM = manga?.data?.[0]?.members ?? 0;
  const score = Math.max(animeM, mangaM);
  if (score > 0) console.log(`[jikan] "${termo}" → ${score.toLocaleString()} membros`);
  return Math.round(score * 0.5);
}

// ─── AniList (anime + manga) ─────────────────────────────────────────────────
async function anilistScore(termo: string): Promise<number> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    let res: Response;
    try {
      res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `query($s:String){Media(search:$s,sort:POPULARITY_DESC){popularity favourites}}`, variables: { s: termo } }),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(t); }
    if (!res.ok) return 0;
    const data = await res.json() as any;
    const pop = data?.data?.Media?.popularity ?? 0;
    const fav = data?.data?.Media?.favourites ?? 0;
    return Math.round((pop * 0.3) + (fav * 2));
  } catch { return 0; }
}

// ─── Open Library (livros, mangás, HQs) ──────────────────────────────────────
async function openLibraryScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=1&fields=edition_count,ratings_count`);
  const doc = data?.docs?.[0];
  if (!doc) return 0;
  return ((doc.edition_count ?? 0) * 2_000) + ((doc.ratings_count ?? 0) * 100);
}

// ─── MusicBrainz (músicos e bandas) ──────────────────────────────────────────
async function musicBrainzScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(termo)}&fmt=json&limit=1`, { headers: { 'User-Agent': 'NoitadaBot/1.0 (noitadaserver.com.br)' } });
  const a = data?.artists?.[0];
  if (!a) return 0;
  return ((a.score ?? 0) * 3_000) + ((a.tags?.reduce((s: number, t: any) => s + t.count, 0) ?? 0) * 500);
}

// ─── OMDB (filmes e séries) ───────────────────────────────────────────────────
async function omdbScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://www.omdbapi.com/?s=${encodeURIComponent(termo)}&apikey=trilogy`);
  return parseInt(data?.totalResults ?? '0', 10) * 10_000;
}

// ─── RAWG (jogos — alternativa gratuita ao IGDB) ──────────────────────────────
async function rawgScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://api.rawg.io/api/games?search=${encodeURIComponent(termo)}&page_size=1&key=`);
  const g = data?.results?.[0];
  if (!g) return 0;
  return Math.round(((g.ratings_count ?? 0) * 500) + ((g.added ?? 0) * 10));
}

// ─── Fandom Wiki (busca via MediaWiki API) ────────────────────────────────────
// Tenta buscar no fandom.com pelo termo + views aproximadas via search count
async function fandomScore(termo: string): Promise<number> {
  try {
    // Usa a API de busca do Fandom
    const slug = termo.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const data = await fetchJson(`https://community.fandom.com/api/v1/SearchSuggestions/List?query=${encodeURIComponent(termo)}&limit=1`);
    const items = data?.items ?? [];
    // Cada resultado do Fandom vale 20K (é um wiki dedicado ao tema)
    return items.length > 0 ? 20_000 : 0;
  } catch { return 0; }
}

// ─── Goodreads via Open Library (já coberto) ─────────────────────────────────
// ─── IMDB via OMDB (já coberto) ───────────────────────────────────────────────
// ─── Last.fm ──────────────────────────────────────────────────────────────────
async function lastfmScore(termo: string): Promise<number> {
  // Usa API pública sem chave via busca
  const data = await fetchJson(`https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(termo)}&api_key=3d2b6e9e0b8c6f37c4f4b9a5c2e1d7f8&format=json&limit=1`);
  const listeners = parseInt(data?.results?.artistmatches?.artist?.[0]?.listeners ?? '0', 10);
  if (listeners > 0) console.log(`[lastfm] "${termo}" → ${listeners.toLocaleString()} ouvintes`);
  return Math.round(listeners * 0.05);
}

// ─── Metacritic via busca pública ─────────────────────────────────────────────
// Coberto indiretamente pelo RAWG (inclui metacritic score)

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

  // ── ESTRATÉGIA DE BUSCA ──────────────────────────────────────────────────────
  // Busca o PERSONAGEM dentro do contexto do VÍNCULO.
  // Objetivo: encontrar resultados específicos do personagem NA obra/franquia.
  //
  // Exemplos:
  //   personagem="Naruto Uzumaki" + vinculo="Naruto Shippuden"
  //     → busca: "Naruto Uzumaki" "Naruto Shippuden" (personagem dentro da obra)
  //     → fallback: "Naruto Uzumaki Naruto Shippuden" (sem aspas, se não achar)
  //
  //   personagem="Rafael" + vinculo="Tartarugas Ninjas"
  //     → busca: "Rafael" "Tartarugas Ninjas" (Rafael especificamente das TN)
  //     → fallback: "Rafael Tartarugas Ninjas"
  //
  //   personagem="Batman" + vinculo="" (sem vínculo)
  //     → busca: "Batman" (só o personagem)
  //
  // termoCom = busca com aspas para garantir personagem dentro do vínculo
  // termoSem = busca sem aspas como fallback
  const termoCom = vinculo
    ? `"${personagem}" "${vinculo}"`   // aspas = DEVE conter ambos
    : `"${personagem}"`;

  const termoSem = vinculo
    ? `${personagem} ${vinculo}`       // sem aspas = fallback mais amplo
    : personagem;

  console.log(`[raridade] buscando personagem="${personagem}" no vínculo="${vinculo||'(nenhum)'}"`);

  // Todas as fontes em paralelo
  const [
    viewsWiki, scoreWikidata,
    scoreJikan, scoreAnilist,
    scoreOpenLib, scoreMusicBrainz,
    scoreOmdb, scoreRawg,
    scoreFandom, scoreLastfm,
  ] = await Promise.all([
    // Wikipedia — busca personagem+vínculo com aspas (exacto), fallback sem aspas
    Promise.all(LINGUAS_WIKI.map(lang => wikiViews(termoCom, lang)))
      .then(async views => {
        const soma = views.reduce((s, v) => s + v, 0);
        if (soma === 0) {
          const v2 = await Promise.all(LINGUAS_WIKI.map(lang => wikiViews(termoSem, lang)));
          return v2.reduce((s, v) => s + v, 0);
        }
        return soma;
      }),
    // Wikidata — personagem dentro do vínculo, fallback sem aspas
    wikidataScore(termoCom).then(s => s || wikidataScore(termoSem)),
    // Jikan/MAL — personagem+vínculo (ex: "Rafael" "Tartarugas Ninjas")
    jikanScore(termoCom).then(s => s || jikanScore(termoSem)),
    // AniList — personagem+vínculo
    anilistScore(termoCom).then(s => s || anilistScore(termoSem)),
    // Open Library — personagem dentro da obra
    openLibraryScore(termoCom).then(s => s || openLibraryScore(termoSem)),
    // MusicBrainz — músico dentro do contexto
    musicBrainzScore(termoCom).then(s => s || musicBrainzScore(termoSem)),
    // OMDB — personagem no filme/série
    omdbScore(termoCom).then(s => s || omdbScore(termoSem)),
    // RAWG — personagem no jogo
    rawgScore(termoCom).then(s => s || rawgScore(termoSem)),
    // Fandom — personagem na franquia
    fandomScore(termoCom).then(s => s || fandomScore(termoSem)),
    // Last.fm — músico/banda
    lastfmScore(termoCom).then(s => s || lastfmScore(termoSem)),
  ]);

  const scoreTotal = viewsWiki + scoreWikidata + scoreJikan + scoreAnilist +
                     scoreOpenLib + scoreMusicBrainz + scoreOmdb + scoreRawg +
                     scoreFandom + scoreLastfm;

  const raridade = calcularRaridade(scoreTotal);

  console.log(`[raridade] RESULTADO "${personagem}" em "${vinculo||'sem vínculo'}":
    Wiki: ${viewsWiki.toLocaleString('pt-BR')} | Wikidata: ${scoreWikidata.toLocaleString('pt-BR')}
    Jikan/MAL: ${scoreJikan.toLocaleString('pt-BR')} | AniList: ${scoreAnilist.toLocaleString('pt-BR')}
    OpenLib: ${scoreOpenLib.toLocaleString('pt-BR')} | MusicBrainz: ${scoreMusicBrainz.toLocaleString('pt-BR')}
    OMDB: ${scoreOmdb.toLocaleString('pt-BR')} | RAWG: ${scoreRawg.toLocaleString('pt-BR')}
    Fandom: ${scoreFandom.toLocaleString('pt-BR')} | Last.fm: ${scoreLastfm.toLocaleString('pt-BR')}
    TOTAL: ${scoreTotal.toLocaleString('pt-BR')} → ${raridade}`);

  const resultado = { raridade, total: scoreTotal, fonte: 'multi' };
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}