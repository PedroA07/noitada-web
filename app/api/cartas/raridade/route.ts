// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache em memória — 24h por chave
const cache = new Map<string, { raridade: string; total: number; fonte: string; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// ─── THRESHOLDS CALIBRADOS ────────────────────────────────────────────────────
// Testados com Custom Search JSON API (pesquisa na web toda):
//   Naruto Uzumaki        → ~400-600M → lendário  ✓
//   Sasuke Uchiha         → ~200-400M → lendário  ✓
//   Mikasa Ackerman       → ~50-150M  → épico     ✓
//   Personagem médio      → ~5-50M    → raro      ✓
//   Personagem de nicho   → ~500K-5M  → incomum   ✓
//   Personagem obscuro    → <500K     → comum     ✓
function calcularRaridade(total: number): string {
  if (total >= 200_000_000) return 'lendario'; // 200M+
  if (total >= 30_000_000)  return 'epico';    // 30M+
  if (total >= 3_000_000)   return 'raro';     // 3M+
  if (total >= 300_000)     return 'incomum';  // 300K+
  return 'comum';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = searchParams.get('personagem')?.trim() ?? '';
  const vinculo    = searchParams.get('vinculo')?.trim()    ?? '';

  if (!personagem || personagem.length < 2) {
    return NextResponse.json({ erro: 'Parâmetro "personagem" obrigatório (mín. 2 chars)' }, { status: 400 });
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

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    console.warn('⚠️ GOOGLE_API_KEY ou GOOGLE_CX não configurados na Vercel.');
    return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'sem_api', sem_api: true });
  }

  try {
    // Query: "personagem vinculo" — sem aspas duplas no JSON, só espaço
    // Aspas forçam correspondência exata e podem retornar 0 resultados
    const queryStr = vinculo ? `${personagem} ${vinculo}` : personagem;
    const query    = encodeURIComponent(queryStr);
    const url      = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=1&fields=searchInformation(totalResults)`;

    console.log(`🔍 Buscando raridade: "${queryStr}"`);

    const res = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });

    // 429 = quota diária esgotada (100 req/dia no plano gratuito)
    if (res.status === 429) {
      console.warn('⚠️ Quota do Google Custom Search esgotada.');
      return NextResponse.json({ raridade: 'comum', total: 0, fonte: 'quota', quota: true });
    }

    if (!res.ok) {
      const corpo = await res.text();
      console.error(`❌ Google API ${res.status}: ${corpo.slice(0, 300)}`);
      throw new Error(`Google API retornou ${res.status}`);
    }

    const data     = await res.json() as { searchInformation?: { totalResults?: string } };
    const totalStr = data?.searchInformation?.totalResults ?? '0';
    const total    = parseInt(totalStr, 10) || 0;
    const raridade = calcularRaridade(total);

    console.log(`✅ "${queryStr}": ${total.toLocaleString('pt-BR')} resultados → ${raridade}`);

    // Salva no cache
    cache.set(chave, { raridade, total, fonte: 'google', expira: Date.now() + CACHE_TTL });

    return NextResponse.json({ raridade, total, fonte: 'google', cache: false });

  } catch (error: any) {
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    console.error(`❌ Erro raridade${isTimeout ? ' (timeout)' : ''}:`, error?.message ?? error);
    return NextResponse.json({
      raridade: 'comum',
      total: 0,
      fonte: isTimeout ? 'timeout' : 'erro',
      erro: error?.message,
    });
  }
}