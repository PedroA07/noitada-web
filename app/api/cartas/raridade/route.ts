// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Node.js runtime — necessário para AbortController com setTimeout

const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function calcularRaridade(total: number): string {
  if (total >= 200_000_000) return 'lendario';
  if (total >= 30_000_000)  return 'epico';
  if (total >= 3_000_000)   return 'raro';
  if (total >= 300_000)     return 'incomum';
  return 'comum';
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

  if (!apiKey || !cx) {
    console.warn('[raridade] GOOGLE_API_KEY ou GOOGLE_CX nao definidos');
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'sem_api', sem_api: true });
  }

  const queryStr = vinculo ? `${personagem} ${vinculo}` : personagem;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(queryStr)}&num=1&fields=searchInformation(totalResults)`;

  console.log(`[raridade] buscando: "${queryStr}"`);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    const bodyText = await res.text();
    console.log(`[raridade] status=${res.status} body=${bodyText.slice(0, 400)}`);

    if (!res.ok) {
      let motivo = `status_${res.status}`;
      try { motivo = (JSON.parse(bodyText)?.error?.message ?? motivo); } catch {}
      console.error(`[raridade] erro Google: ${motivo}`);
      return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'sem_api', sem_api: true });
    }

    const data  = JSON.parse(bodyText) as { searchInformation?: { totalResults?: string } };
    const total = parseInt(data?.searchInformation?.totalResults ?? '0', 10) || 0;
    const raridade = calcularRaridade(total);

    console.log(`[raridade] "${queryStr}" -> ${total.toLocaleString('pt-BR')} -> ${raridade}`);
    cache.set(chave, { raridade, total, fonte: 'google', expira: Date.now() + CACHE_TTL });
    return NextResponse.json({ raridade, total, fonte: 'google', cache: false });

  } catch (err: any) {
    const isAbort = err?.name === 'AbortError';
    console.error(`[raridade] ${isAbort ? 'TIMEOUT' : 'ERRO'}: ${err?.message}`);
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'sem_api', sem_api: true });
  }
}