// app/api/cartas/raridade/route.ts
// Busca a popularidade do PERSONAGEM dentro do contexto do VÍNCULO.
// Se o personagem não for encontrado dentro do vínculo, retorna 0.
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const LINGUAS_WIKI = ['en', 'pt', 'es', 'fr', 'de', 'it', 'ja', 'ru', 'zh', 'ko'];

// Thresholds baseados na soma de todas as fontes
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

// Verifica se o texto contém o personagem (normalizado)
function contemPersonagem(texto: string, personagem: string): boolean {
  const t = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Tenta cada palavra do nome do personagem (pelo menos 1 deve aparecer no título)
  const palavras = personagem.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(p => p.length > 2); // ignora palavras curtas como "de", "da"
  return palavras.some(p => t.includes(p));
}

// ─── Wikipedia — busca personagem dentro do vínculo ──────────────────────────
// Garante que o artigo encontrado realmente é sobre o personagem, não só a franquia
async function wikiViews(personagem: string, vinculo: string, lang: string): Promise<number> {
  try {
    // Busca com personagem + vínculo
    const query = vinculo ? `${personagem} ${vinculo}` : personagem;
    const search = await fetchJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&origin=*`
    );
    const resultados: { title: string; snippet: string }[] = search?.query?.search ?? [];
    if (!resultados.length) return 0;

    // Filtra: o artigo DEVE mencionar o personagem no título ou snippet
    // Isso evita que "Personagem Aleatório" "Devil May Cry" retorne o artigo do DMC
    const artigo = resultados.find(r => contemPersonagem(r.title, personagem) || contemPersonagem(r.snippet, personagem));
    if (!artigo) {
      console.log(`[wiki/${lang}] "${personagem}" NÃO encontrado nos resultados de "${query}"`);
      return 0;
    }

    const t = encodeURIComponent(artigo.title.replace(/ /g, '_'));
    const views = await fetchJson(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/${lang}.wikipedia/all-access/all-agents/${t}/monthly/20230101/20241201`
    );
    const items: any[] = views?.items ?? [];
    if (!items.length) return 0;
    const media = Math.round(items.reduce((s, i) => s + i.views, 0) / items.length);
    if (media > 0) console.log(`[wiki/${lang}] "${artigo.title}" → ${media.toLocaleString()} views/mês`);
    return media;
  } catch { return 0; }
}

// ─── Wikidata — verifica se entidade menciona personagem ─────────────────────
async function wikidataScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo ? `${personagem} ${vinculo}` : personagem;
  const search = await fetchJson(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=pt&format=json&limit=3&origin=*`
  );
  const resultados: { id: string; label: string; description: string }[] = search?.search ?? [];

  // Filtra: label ou description deve mencionar o personagem
  const entidade = resultados.find(r =>
    contemPersonagem(r.label ?? '', personagem) ||
    contemPersonagem(r.description ?? '', personagem)
  );
  if (!entidade) return 0;

  const entity = await fetchJson(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entidade.id}&props=sitelinks&format=json&origin=*`
  );
  const count = Object.keys(entity?.entities?.[entidade.id]?.sitelinks ?? {}).length;
  if (count > 0) console.log(`[wikidata] "${entidade.label}" → ${count} sitelinks`);
  return count * 5_000;
}

// ─── Jikan/MyAnimeList — busca personagem em anime/manga ────────────────────
async function jikanScore(personagem: string, vinculo: string): Promise<number> {
  // Busca personagem diretamente (não a obra)
  const data = await fetchJson(
    `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(personagem)}&limit=5&order_by=favorites&sort=desc`
  );
  const chars: any[] = data?.data ?? [];

  // Filtra: o personagem deve estar associado ao vínculo
  const char = vinculo
    ? chars.find(c =>
        contemPersonagem(c.name ?? '', personagem) &&
        c.anime?.some((a: any) => contemPersonagem(a.anime?.title ?? '', vinculo)) ||
        c.manga?.some((m: any) => contemPersonagem(m.manga?.title ?? '', vinculo))
      ) || chars.find(c => contemPersonagem(c.name ?? '', personagem))
    : chars.find(c => contemPersonagem(c.name ?? '', personagem));

  if (!char) return 0;
  const favorites = char.favorites ?? 0;
  if (favorites > 0) console.log(`[jikan] "${char.name}" → ${favorites.toLocaleString()} favoritos`);
  return Math.round(favorites * 10); // pondera favoritos
}

// ─── AniList — busca personagem ──────────────────────────────────────────────
async function anilistScore(personagem: string, vinculo: string): Promise<number> {
  try {
    const query = `query($s:String){Character(search:$s){favourites name{full}media{nodes{title{romaji english}}}}}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    let res: Response;
    try {
      res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { s: personagem } }),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(t); }
    if (!res.ok) return 0;
    const data = await res.json() as any;
    const char = data?.data?.Character;
    if (!char) return 0;

    // Se tem vínculo, verifica se o personagem pertence à obra
    if (vinculo) {
      const midias: any[] = char.media?.nodes ?? [];
      const pertenceAObra = midias.some((m: any) =>
        contemPersonagem(m.title?.romaji ?? '', vinculo) ||
        contemPersonagem(m.title?.english ?? '', vinculo)
      );
      if (!pertenceAObra) {
        console.log(`[anilist] "${char.name?.full}" não pertence a "${vinculo}"`);
        return 0;
      }
    }

    const fav = char.favourites ?? 0;
    if (fav > 0) console.log(`[anilist] "${char.name?.full}" → ${fav.toLocaleString()} favoritos`);
    return Math.round(fav * 8);
  } catch { return 0; }
}

// ─── Open Library ─────────────────────────────────────────────────────────────
async function openLibraryScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo ? `${personagem} ${vinculo}` : personagem;
  const data = await fetchJson(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=title,edition_count,ratings_count`
  );
  const docs: any[] = data?.docs ?? [];
  const doc = docs.find(d => contemPersonagem(d.title ?? '', personagem));
  if (!doc) return 0;
  return ((doc.edition_count ?? 0) * 2_000) + ((doc.ratings_count ?? 0) * 100);
}

// ─── MusicBrainz ─────────────────────────────────────────────────────────────
async function musicBrainzScore(personagem: string): Promise<number> {
  const data = await fetchJson(
    `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(personagem)}&fmt=json&limit=3`,
    { headers: { 'User-Agent': 'NoitadaBot/1.0 (noitadaserver.com.br)' } }
  );
  const artists: any[] = data?.artists ?? [];
  const artist = artists.find(a => contemPersonagem(a.name ?? '', personagem));
  if (!artist) return 0;
  return ((artist.score ?? 0) * 3_000) + ((artist.tags?.reduce((s: number, t: any) => s + t.count, 0) ?? 0) * 500);
}

// ─── OMDB ─────────────────────────────────────────────────────────────────────
async function omdbScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo || personagem;
  const data = await fetchJson(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=trilogy`);
  const results: any[] = data?.Search ?? [];
  // Verifica se algum resultado menciona o personagem (no título ou como parte)
  const match = results.find(r => contemPersonagem(r.Title ?? '', personagem) || contemPersonagem(r.Title ?? '', vinculo || personagem));
  if (!match && results.length === 0) return 0;
  const total = parseInt(data?.totalResults ?? '0', 10);
  // Só conta se achou resultado relevante
  if (!match && !vinculo) return 0;
  return total * 5_000;
}

// ─── RAWG (jogos) ─────────────────────────────────────────────────────────────
async function rawgScore(personagem: string, vinculo: string): Promise<number> {
  const query = vinculo || personagem;
  const data = await fetchJson(`https://api.rawg.io/api/games?search=${encodeURIComponent(query)}&page_size=3&key=`);
  const results: any[] = data?.results ?? [];
  const match = results.find(r => contemPersonagem(r.name ?? '', vinculo || personagem));
  if (!match) return 0;
  return Math.round(((match.ratings_count ?? 0) * 500) + ((match.added ?? 0) * 10));
}

// ─── Last.fm ──────────────────────────────────────────────────────────────────
async function lastfmScore(personagem: string): Promise<number> {
  const data = await fetchJson(
    `https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${encodeURIComponent(personagem)}&api_key=3d2b6e9e0b8c6f37c4f4b9a5c2e1d7f8&format=json&limit=3`
  );
  const artists: any[] = data?.results?.artistmatches?.artist ?? [];
  const match = artists.find(a => contemPersonagem(a.name ?? '', personagem));
  if (!match) return 0;
  return Math.round(parseInt(match.listeners ?? '0', 10) * 0.05);
}

// Mapeamento categoria → fontes prioritárias
const FONTES_POR_CATEGORIA: Record<string, string[]> = {
  anime:   ['jikan','anilist','wiki','wikidata'],
  serie:   ['omdb','wiki','wikidata'],
  filme:   ['omdb','wiki','wikidata'],
  desenho: ['omdb','wiki','wikidata'],
  jogo:    ['rawg','wiki','wikidata'],
  musica:  ['musicbrainz','lastfm','wiki'],
  outro:   ['wiki','wikidata','openlib'],
};

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

  console.log(`[raridade] buscando "${personagem}" | vínculo="${vinculo||'(nenhum)'}" | categoria="${categoria||'(nenhuma)'}"`);

  // Multiplica score por peso conforme a categoria
  // Fontes relevantes para a categoria recebem peso maior
  const fontesPrioritarias = FONTES_POR_CATEGORIA[categoria] ?? ['wiki','wikidata'];
  const peso = (fonte: string) => fontesPrioritarias.includes(fonte) ? 2 : 1;

  const [
    viewsWiki,
    scoreWikidata,
    scoreJikan,
    scoreAnilist,
    scoreOpenLib,
    scoreMusicBrainz,
    scoreOmdb,
    scoreRawg,
    scoreLastfm,
  ] = await Promise.all([
    Promise.all(LINGUAS_WIKI.map(lang => wikiViews(personagem, vinculo, lang)))
      .then(views => views.reduce((s, v) => s + v, 0) * peso('wiki')),
    wikidataScore(personagem, vinculo).then(s => s * peso('wikidata')),
    jikanScore(personagem, vinculo).then(s => s * peso('jikan')),
    anilistScore(personagem, vinculo).then(s => s * peso('anilist')),
    openLibraryScore(personagem, vinculo).then(s => s * peso('openlib')),
    musicBrainzScore(personagem).then(s => s * peso('musicbrainz')),
    omdbScore(personagem, vinculo).then(s => s * peso('omdb')),
    rawgScore(personagem, vinculo).then(s => s * peso('rawg')),
    lastfmScore(personagem).then(s => s * peso('lastfm')),
  ]);

  const scoreTotal = viewsWiki + scoreWikidata + scoreJikan + scoreAnilist +
                     scoreOpenLib + scoreMusicBrainz + scoreOmdb + scoreRawg + scoreLastfm;

  const raridade = calcularRaridade(scoreTotal);

  console.log(`[raridade] RESULTADO "${personagem}" em "${vinculo || 'sem vínculo'}":
    Wiki: ${viewsWiki.toLocaleString('pt-BR')} | Wikidata: ${scoreWikidata.toLocaleString('pt-BR')}
    Jikan: ${scoreJikan.toLocaleString('pt-BR')} | AniList: ${scoreAnilist.toLocaleString('pt-BR')}
    OpenLib: ${scoreOpenLib.toLocaleString('pt-BR')} | MusicBrainz: ${scoreMusicBrainz.toLocaleString('pt-BR')}
    OMDB: ${scoreOmdb.toLocaleString('pt-BR')} | RAWG: ${scoreRawg.toLocaleString('pt-BR')}
    Last.fm: ${scoreLastfm.toLocaleString('pt-BR')}
    TOTAL: ${scoreTotal.toLocaleString('pt-BR')} → ${raridade}`);

  const resultado = { raridade, total: scoreTotal, fonte: 'multi' };
  cache.set(chave, { ...resultado, expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, cache: false });
}