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

async function buscarGoogle(personagem: string, vinculo: string, apiKey: string, cx: string): Promise<{ raridade: string; total: number } | null> {
  const queryStr = vinculo ? `${personagem} ${vinculo}` : personagem;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(queryStr)}&num=1&fields=searchInformation(totalResults)`;
  console.log(`[raridade/google] "${queryStr}"`);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res: Response;
    try { res = await fetch(url, { signal: controller.signal }); }
    finally { clearTimeout(timer); }
    const body = await res.text();
    console.log(`[raridade/google] status=${res.status} body=${body.slice(0,200)}`);
    if (!res.ok) return null;
    const data  = JSON.parse(body) as { searchInformation?: { totalResults?: string } };
    const total = parseInt(data?.searchInformation?.totalResults ?? '0', 10) || 0;
    return { raridade: calcularRaridade(total), total };
  } catch { return null; }
}

async function buscarWikipedia(personagem: string, vinculo: string): Promise<{ raridade: string; total: number } | null> {
  try {
    const termos = vinculo ? [`${personagem} ${vinculo}`, personagem] : [personagem];
    for (const termo of termos) {
      const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(termo)}&format=json&srlimit=1&origin=*`;
      const res = await fetch(searchUrl);
      if (!res.ok) continue;
      const data = await res.json() as { query?: { search?: { title: string }[] } };
      const hit  = data?.query?.search?.[0];
      if (!hit) continue;
      const titulo   = encodeURIComponent(hit.title.replace(/ /g, '_'));
      const viewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/pt.wikipedia/all-access/all-agents/${titulo}/monthly/20240101/20241201`;
      const resV = await fetch(viewsUrl);
      if (resV.ok) {
        const vd = await resV.json() as { items?: { views: number }[] };
        const totalViews = vd?.items?.reduce((s, i) => s + (i.views || 0), 0) ?? 0;
        const raridade = calcularRaridade(totalViews * 6);
        console.log(`[raridade/wiki] "${termo}" → ${totalViews.toLocaleString()} views → ${raridade}`);
        return { raridade, total: totalViews };
      }
    }
  } catch (err: any) { console.error('[raridade/wiki]', err?.message); }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = (searchParams.get('personagem') ?? '').trim();
  const vinculo    = (searchParams.get('vinculo')    ?? '').trim();
  const usarWiki   = searchParams.get('wiki') === '1';

  if (personagem.length < 2) {
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'invalido' }, { status: 400 });
  }

  const chave  = `${usarWiki ? 'wiki:' : ''}${personagem}:${vinculo}`.toLowerCase();
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({ raridade: cached.raridade, total: cached.total, fonte: cached.fonte, cache: true });
  }

  // ── Modo Wikipedia (requisitado manualmente pelo usuário)
  if (usarWiki) {
    const resultado = await buscarWikipedia(personagem, vinculo);
    if (resultado) {
      cache.set(chave, { ...resultado, fonte: 'wikipedia', expira: Date.now() + CACHE_TTL });
      return NextResponse.json({ ...resultado, fonte: 'wikipedia', cache: false });
    }
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'wikipedia', cache: false });
  }

  // ── Modo Google (padrão)
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'sem_api', sem_api: true });
  }

  const resultado = await buscarGoogle(personagem, vinculo, apiKey, cx);

  if (!resultado) {
    // Google falhou — sinaliza para o frontend oferecer o botão Wikipedia
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'google_falhou', google_falhou: true });
  }

  cache.set(chave, { ...resultado, fonte: 'google', expira: Date.now() + CACHE_TTL });
  return NextResponse.json({ ...resultado, fonte: 'google', cache: false });
}