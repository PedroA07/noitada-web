// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// NÃO usar runtime = 'edge' — AbortSignal.timeout não funciona no Edge da Vercel

// Cache em memória — 24h por chave
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
    return NextResponse.json(
      { raridade: 'comum', total: 0, fonte: 'invalido', erro: 'personagem muito curto' },
      { status: 400 }
    );
  }

  const chave  = `${personagem}:${vinculo}`.toLowerCase();
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({ raridade: cached.raridade, total: cached.total, fonte: cached.fonte, cache: true });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    console.warn('[raridade] GOOGLE_API_KEY ou GOOGLE_CX ausentes');
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'sem_api', sem_api: true });
  }

  const queryStr = vinculo ? `${personagem} ${vinculo}` : personagem;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(queryStr)}&num=1&fields=searchInformation(totalResults)`;

  console.log(`[raridade] buscando: "${queryStr}"`);

  try {
    // Timeout manual via Promise.race — compatível com Node.js runtime da Vercel
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 8000)
    );
    const res = await Promise.race([fetch(url), timeoutPromise]) as Response;

    if (res.status === 429) {
      console.warn('[raridade] quota Google esgotada');
      return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'quota', quota: true });
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[raridade] Google API ${res.status}: ${body.slice(0, 200)}`);
      return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'erro_api', erro: `status ${res.status}` });
    }

    const data  = await res.json() as { searchInformation?: { totalResults?: string } };
    const total = parseInt(data?.searchInformation?.totalResults ?? '0', 10) || 0;
    const raridade = calcularRaridade(total);

    console.log(`[raridade] "${queryStr}" → ${total.toLocaleString('pt-BR')} → ${raridade}`);

    cache.set(chave, { raridade, total, fonte: 'google', expira: Date.now() + CACHE_TTL });

    return NextResponse.json({ raridade, total, fonte: 'google', cache: false });

  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error(`[raridade] erro: ${msg}`);
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'erro', erro: msg });
  }
}