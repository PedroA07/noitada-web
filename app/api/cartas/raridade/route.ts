// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const LINGUAS_WIKI = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ru', 'zh', 'ko'];

function calcularRaridade(score: number): string {
  if (score >= 1_000_000) return 'lendario';
  if (score >= 500_000)   return 'epico';
  if (score >= 250_000)   return 'raro';
  if (score >= 50_000)    return 'incomum';
  return 'comum';
}

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

function contemPersonagem(texto: string, personagem: string): boolean {
  const normaliza = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const t = normaliza(texto);
  const palavras = normaliza(personagem).split(/\s+/).filter(p => p.length > 2);
  return palavras.some(p => t.includes(p));
}

// ─── Wikipedia ────────────────────────────────────────────────────────────────
async function wikiViews(personagem: string, vinculo: string, lang: string): Promise<number> {
  const query = vinculo ? `${personagem} ${vinculo}` : personagem;
  const search = await fetchJson(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&origin=*`);
  const resultados: {title:string;snippet:string}[] = search?.query?.search ?? [];
  const artigo = resultados.find(r => contemPersonagem(r.title, personagem) || contemPersonagem(r.snippet, personagem));
  if (!artigo) return 0;
  const t = encodeURIComponent(artigo.title.replace(/ /g,'_'));
  const views = await fetchJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents/${t}/monthly/20230101/20241201`);
  const items: any[] = views?.items ?? [];
  if (!items.length) return 0;
  return Math.round(items.reduce((s,i) => s + i.views, 0) / items.length);
}

// ─── Wikidata ─────────────────────────────────────────────────────────────────
async function wikidataScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo ? `${personagem} ${vinculo}` : personagem;
  const search = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=pt&format=json&limit=3&origin=*`);
  const resultados: {id:string;label:string;description:string}[] = search?.search ?? [];
  const entidade = resultados.find(r => contemPersonagem(r.label??'', personagem) || contemPersonagem(r.description??'', personagem));
  if (!entidade) return 0;
  const entity = await fetchJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entidade.id}&props=sitelinks&format=json&origin=*`);
  return Object.keys(entity?.entities?.[entidade.id]?.sitelinks ?? {}).length * 5_000;
}

// ─── Jikan/MAL — SOMENTE para anime/manga ────────────────────────────────────
async function jikanScore(personagem: string, vinculo: string): Promise<number> {
  const data = await fetchJson(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(personagem)}&limit=5&order_by=favorites&sort=desc`);
  const chars: any[] = data?.data ?? [];
  const char = vinculo
    ? chars.find(c => contemPersonagem(c.name??'', personagem) && (
        c.anime?.some((a:any) => contemPersonagem(a.anime?.title??'', vinculo)) ||
        c.manga?.some((m:any) => contemPersonagem(m.manga?.title??'', vinculo))
      )) || chars.find(c => contemPersonagem(c.name??'', personagem))
    : chars.find(c => contemPersonagem(c.name??'', personagem));
  if (!char) return 0;
  const fav = char.favorites ?? 0;
  if (fav > 0) console.log(`[jikan] "${char.name}" → ${fav.toLocaleString()} favoritos`);
  return fav * 10;
}

// ─── AniList — SOMENTE para anime/manga ──────────────────────────────────────
async function anilistScore(personagem: string, vinculo: string): Promise<number> {
  try {
    const query = `query($s:String){Character(search:$s){favourites name{full}media{nodes{title{romaji english}}}}}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    let res: Response;
    try {
      res = await fetch('https://graphql.anilist.co', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({query, variables:{s:personagem}}),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(t); }
    if (!res.ok) return 0;
    const data = await res.json() as any;
    const char = data?.data?.Character;
    if (!char) return 0;
    if (vinculo) {
      const midias: any[] = char.media?.nodes ?? [];
      const pertence = midias.some((m:any) =>
        contemPersonagem(m.title?.romaji??'', vinculo) || contemPersonagem(m.title?.english??'', vinculo)
      );
      if (!pertence) { console.log(`[anilist] "${char.name?.full}" não pertence a "${vinculo}"`); return 0; }
    }
    const fav = char.favourites ?? 0;
    if (fav > 0) console.log(`[anilist] "${char.name?.full}" → ${fav.toLocaleString()} favoritos`);
    return fav * 8;
  } catch { return 0; }
}

// ─── Open Library — SOMENTE para livros/hq ───────────────────────────────────
async function openLibraryScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo ? `${personagem} ${vinculo}` : personagem;
  const data = await fetchJson(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=title,edition_count,ratings_count`);
  const docs: any[] = data?.docs ?? [];
  const doc = docs.find(d => contemPersonagem(d.title??'', personagem));
  if (!doc) return 0;
  return ((doc.edition_count??0) * 2_000) + ((doc.ratings_count??0) * 100);
}

// ─── MusicBrainz — SOMENTE para música ───────────────────────────────────────
async function musicBrainzScore(personagem: string): Promise<number> {
  const data = await fetchJson(`https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(personagem)}&fmt=json&limit=3`, {headers:{'User-Agent':'NoitadaBot/1.0 (noitadaserver.com.br)'}});
  const artists: any[] = data?.artists ?? [];
  const artist = artists.find(a => contemPersonagem(a.name??'', personagem));
  if (!artist) return 0;
  return ((artist.score??0) * 3_000) + ((artist.tags?.reduce((s:number,t:any)=>s+t.count,0)??0) * 500);
}

// ─── Last.fm — SOMENTE para música ───────────────────────────────────────────
async function lastfmScore(personagem: string): Promise<number> {
  const data = await fetchJson(`https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(personagem)}&api_key=3d2b6e9e0b8c6f37c4f4b9a5c2e1d7f8&format=json&limit=3`);
  const artists: any[] = data?.results?.artistmatches?.artist ?? [];
  const match = artists.find(a => contemPersonagem(a.name??'', personagem));
  if (!match) return 0;
  return Math.round(parseInt(match.listeners??'0', 10) * 0.05);
}

// ─── OMDB — SOMENTE para filmes/séries/desenho ───────────────────────────────
async function omdbScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo || personagem;
  const data = await fetchJson(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=trilogy`);
  const results: any[] = data?.Search ?? [];
  const match = results.find(r => contemPersonagem(r.Title??'', vinculo||personagem));
  if (!match) return 0;
  return parseInt(data?.totalResults??'0', 10) * 5_000;
}

// ─── Google Custom Search — todas as categorias ──────────────────────────────
async function googleScore(personagem: string, vinculo: string): Promise<number> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;
  if (!apiKey || !cx) return 0;
  const query = vinculo ? `${personagem} ${vinculo}` : personagem;
  const data  = await fetchJson(`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}&num=1`);
  const total = parseInt(data?.searchInformation?.totalResults ?? '0', 10);
  if (total > 0) console.log(`[google] "${query}" → ${total.toLocaleString()} resultados`);
  return Math.round(total * 0.001);
}

// ─── RAWG — SOMENTE para jogos ───────────────────────────────────────────────
async function rawgScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo || personagem;
  const data = await fetchJson(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=3&key=`);
  const results: any[] = data?.results ?? [];
  const match = results.find(r => contemPersonagem(r.name??'', vinculo||personagem));
  if (!match) return 0;
  return Math.round(((match.ratings_count??0) * 500) + ((match.added??0) * 10));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = (searchParams.get('personagem') ?? '').trim();
  const vinculo    = (searchParams.get('vinculo')    ?? '').trim();
  const categoria  = (searchParams.get('categoria')  ?? '').trim().toLowerCase();

  if (personagem.length < 2) {
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'invalido' }, { status: 400 });
  }

  const chave  = `${personagem}:${vinculo}:${categoria}`.toLowerCase();
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({ raridade: cached.raridade, total: cached.total, fonte: cached.fonte, cache: true });
  }

  console.log(`[raridade] "${personagem}" | vínculo="${vinculo}" | categoria="${categoria}"`);

  // ── Cada categoria usa APENAS as fontes relevantes ───────────────────────────
  // Isso garante que "Naruto Shippuden" como JOGO dá resultado diferente de ANIME
  let scores: Record<string,number> = {};

  const wiki    = () => Promise.all(LINGUAS_WIKI.map(l => wikiViews(personagem, vinculo, l))).then(vs => vs.reduce((s,v)=>s+v,0));
  const wikidat = () => wikidataScore(personagem, vinculo);

  const google = () => googleScore(personagem, vinculo);

  if (categoria === 'anime' || categoria === 'desenho') {
    const [w, wd, jk, al, omdb, g] = await Promise.all([wiki(), wikidat(), jikanScore(personagem, vinculo), anilistScore(personagem, vinculo), omdbScore(personagem, vinculo), google()]);
    scores = { wiki:w, wikidata:wd, jikan:jk, anilist:al, omdb, google:g };

  } else if (categoria === 'serie') {
    const [w, wd, omdb, jk, al, g] = await Promise.all([wiki(), wikidat(), omdbScore(personagem, vinculo), jikanScore(personagem, vinculo), anilistScore(personagem, vinculo), google()]);
    scores = { wiki:w, wikidata:wd, omdb, jikan:jk, anilist:al, google:g };

  } else if (categoria === 'filme') {
    const [w, wd, omdb, g] = await Promise.all([wiki(), wikidat(), omdbScore(personagem, vinculo), google()]);
    scores = { wiki:w, wikidata:wd, omdb, google:g };

  } else if (categoria === 'jogo') {
    const [w, wd, rawg, g] = await Promise.all([wiki(), wikidat(), rawgScore(personagem, vinculo), google()]);
    scores = { wiki:w, wikidata:wd, rawg, google:g };

  } else if (categoria === 'musica') {
    const [w, wd, mb, lfm, g] = await Promise.all([wiki(), wikidat(), musicBrainzScore(personagem), lastfmScore(personagem), google()]);
    scores = { wiki:w, wikidata:wd, musicbrainz:mb, lastfm:lfm, google:g };

  } else if (categoria === 'hq') {
    const [w, wd, ol, g] = await Promise.all([wiki(), wikidat(), openLibraryScore(personagem, vinculo), google()]);
    scores = { wiki:w, wikidata:wd, openlib:ol, google:g };

  } else {
    // outro / sem categoria — usa wiki + wikidata + todas
    const [w, wd, jk, al, ol, mb, omdb, rawg, lfm, g] = await Promise.all([
      wiki(), wikidat(),
      jikanScore(personagem, vinculo), anilistScore(personagem, vinculo),
      openLibraryScore(personagem, vinculo), musicBrainzScore(personagem),
      omdbScore(personagem, vinculo), rawgScore(personagem, vinculo), lastfmScore(personagem),
      google(),
    ]);
    scores = { wiki:w, wikidata:wd, jikan:jk, anilist:al, openlib:ol, musicbrainz:mb, omdb, rawg, lastfm:lfm, google:g };
  }

  const scoreTotal = Object.values(scores).reduce((s,v) => s+v, 0);
  const raridade   = calcularRaridade(scoreTotal);

  const detalhes = Object.entries(scores).map(([k,v]) => `${k}:${v.toLocaleString('pt-BR')}`).join(' | ');
  console.log(`[raridade] TOTAL=${scoreTotal.toLocaleString('pt-BR')} → ${raridade} | ${detalhes}`);

  const resultado = { raridade, total: scoreTotal, fonte: 'multi' };
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}