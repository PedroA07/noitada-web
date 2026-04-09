// app/api/cartas/raridade/route.ts
// Busca popularidade em múltiplas fontes abertas e gratuitas em paralelo
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const LINGUAS_WIKI = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ru', 'zh', 'ko', 'ar', 'pl'];

function calcularRaridade(score: number): string {
  if (score >= 1_000_000) return 'lendario';
  if (score >= 500_000)   return 'epico';
  if (score >= 250_000)   return 'raro';
  if (score >= 50_000)    return 'incomum';
  return 'comum';
}

async function fetchJson(url: string, headers?: Record<string,string>): Promise<any> {
  try {
    const res = await fetch(url, { headers: headers ?? {}, signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// ─── Wikipedia (12 idiomas) ───────────────────────────────────────────────────
async function wikiViews(termo: string, lang: string): Promise<number> {
  const search = await fetchJson(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`);
  const titulo = search?.query?.search?.[0]?.title;
  if (!titulo) return 0;
  const t = encodeURIComponent(titulo.replace(/ /g, '_'));
  const views = await fetchJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents/${t}/monthly/20230101/20241201`);
  const items = views?.items ?? [];
  if (!items.length) return 0;
  return Math.round(items.reduce((s: number, i: any) => s + i.views, 0) / items.length);
}

// ─── Wikidata (sitelinks = presença global) ───────────────────────────────────
async function wikidataScore(termo: string): Promise<number> {
  const search = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(termo)}&language=pt&format=json&limit=1&origin=*`);
  const id = search?.search?.[0]?.id;
  if (!id) return 0;
  const entity = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${id}&props=sitelinks&format=json&origin=*`);
  const count = Object.keys(entity?.entities?.[id]?.sitelinks ?? {}).length;
  return count * 5_000;
}

// ─── Open Library (livros, mangás, HQs) ──────────────────────────────────────
async function openLibraryScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=1&fields=edition_count,ratings_count`);
  const doc = data?.docs?.[0];
  if (!doc) return 0;
  return ((doc.edition_count ?? 0) * 2_000) + ((doc.ratings_count ?? 0) * 100);
}

// ─── MusicBrainz (músicos e bandas) ───────────────────────────────────────────
async function musicBrainzScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(termo)}&fmt=json&limit=1`, { 'User-Agent': 'NoitadaBot/1.0 (noitadaserver.com.br)' });
  const artist = data?.artists?.[0];
  if (!artist) return 0;
  const tags = artist.tags?.reduce((s: number, t: any) => s + t.count, 0) ?? 0;
  return ((artist.score ?? 0) * 3_000) + (tags * 500);
}

// ─── OMDB (filmes e séries) ───────────────────────────────────────────────────
async function omdbScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://www.omdbapi.com/?s=${encodeURIComponent(termo)}&apikey=trilogy`);
  return parseInt(data?.totalResults ?? '0', 10) * 10_000;
}

// ─── MyAnimeList via Jikan API (anime/manga) ──────────────────────────────────
async function jikanScore(termo: string): Promise<number> {
  const [anime, manga] = await Promise.all([
    fetchJson(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(termo)}&limit=1&order_by=members&sort=desc`),
    fetchJson(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(termo)}&limit=1&order_by=members&sort=desc`),
  ]);
  const animeMembers = anime?.data?.[0]?.members ?? 0;
  const mangaMembers = manga?.data?.[0]?.members ?? 0;
  const score = Math.max(animeMembers, mangaMembers);
  if (score > 0) console.log(`[jikan] "${termo}" → ${score.toLocaleString()} membros`);
  return Math.round(score * 0.5); // pondera para equiparar com as outras fontes
}

// ─── AniList (anime/manga — GraphQL) ─────────────────────────────────────────
async function anilistScore(termo: string): Promise<number> {
  const query = `query($s:String){Media(search:$s,sort:POPULARITY_DESC){popularity favourites}}`;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { s: termo } }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
    });
    if (!res.ok) return 0;
    const data = await res.json() as any;
    const pop  = data?.data?.Media?.popularity ?? 0;
    const fav  = data?.data?.Media?.favourites ?? 0;
    const score = Math.round((pop * 0.3) + (fav * 2));
    if (score > 0) console.log(`[anilist] "${termo}" → pop:${pop} fav:${fav} → ${score}`);
    return score;
  } catch { return 0; }
}

// ─── IGDB via Twitch (jogos) ──────────────────────────────────────────────────
// Usa o endpoint público de busca sem autenticação (limitado mas funciona)
async function igdbScore(termo: string): Promise<number> {
  // IGDB requer OAuth — usamos RAWG como alternativa gratuita
  const data = await fetchJson(`https://api.rawg.io/api/games?search=${encodeURIComponent(termo)}&page_size=1&key=`);
  const game = data?.results?.[0];
  if (!game) return 0;
  const score = Math.round(((game.ratings_count ?? 0) * 500) + ((game.added ?? 0) * 10));
  if (score > 0) console.log(`[rawg] "${termo}" → ${score}`);
  return score;
}

// ─── Last.fm (música) ─────────────────────────────────────────────────────────
async function lastfmScore(termo: string): Promise<number> {
  const data = await fetchJson(`https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(termo)}&api_key=3d2b6e9e0b8c6f37c4f4b9a5c2e1d7f8&format=json&limit=1`);
  const listeners = parseInt(data?.results?.artistmatches?.artist?.[0]?.listeners ?? '0', 10);
  return Math.round(listeners * 0.1);
}

// ─── Goodreads via Open Library (livros) ─────────────────────────────────────
// Já coberto pelo openLibraryScore acima

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

  const termoCompleto   = vinculo ? `${personagem} ${vinculo}` : personagem;
  const termoFallback   = vinculo;

  console.log(`[raridade] buscando: "${termoCompleto}"`);

  const [
    viewsWiki,
    scoreWikidata,
    scoreOpenLib,
    scoreMusicBrainz,
    scoreOmdb,
    scoreJikan,
    scoreAnilist,
    scoreIgdb,
  ] = await Promise.all([
    // Wikipedia 12 idiomas em paralelo
    Promise.all(LINGUAS_WIKI.map(lang => wikiViews(termoCompleto, lang)))
      .then(async views => {
        const soma = views.reduce((s, v) => s + v, 0);
        if (soma === 0 && termoFallback) {
          const v2 = await Promise.all(LINGUAS_WIKI.map(lang => wikiViews(termoFallback, lang)));
          return v2.reduce((s, v) => s + v, 0);
        }
        return soma;
      }),
    wikidataScore(termoCompleto).then(s => s || (termoFallback ? wikidataScore(termoFallback) : 0)),
    openLibraryScore(termoCompleto).then(s => s || (termoFallback ? openLibraryScore(termoFallback) : 0)),
    musicBrainzScore(termoCompleto).then(s => s || (termoFallback ? musicBrainzScore(termoFallback) : 0)),
    omdbScore(termoCompleto).then(s => s || (termoFallback ? omdbScore(termoFallback) : 0)),
    // Anime/Manga — Jikan (MyAnimeList)
    jikanScore(termoCompleto).then(s => s || (termoFallback ? jikanScore(termoFallback) : 0)),
    // Anime/Manga — AniList
    anilistScore(termoCompleto).then(s => s || (termoFallback ? anilistScore(termoFallback) : 0)),
    // Jogos — RAWG
    igdbScore(termoCompleto).then(s => s || (termoFallback ? igdbScore(termoFallback) : 0)),
  ]);

  const scoreTotal = viewsWiki + scoreWikidata + scoreOpenLib + scoreMusicBrainz +
                     scoreOmdb + scoreJikan + scoreAnilist + scoreIgdb;
  const raridade   = calcularRaridade(scoreTotal);

  console.log(`[raridade] "${termoCompleto}" TOTAL=${scoreTotal.toLocaleString('pt-BR')} → ${raridade}
    Wiki: ${viewsWiki.toLocaleString('pt-BR')} | Wikidata: ${scoreWikidata.toLocaleString('pt-BR')}
    OpenLib: ${scoreOpenLib.toLocaleString('pt-BR')} | MB: ${scoreMusicBrainz.toLocaleString('pt-BR')}
    OMDB: ${scoreOmdb.toLocaleString('pt-BR')} | Jikan: ${scoreJikan.toLocaleString('pt-BR')}
    AniList: ${scoreAnilist.toLocaleString('pt-BR')} | RAWG: ${scoreIgdb.toLocaleString('pt-BR')}`);

  const resultado = { raridade, total: scoreTotal, fonte: 'multi' };
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}