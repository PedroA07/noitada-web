// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const cache = new Map<string, { raridade: string; total: number; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// ─── LIMITES CALIBRADOS PARA GOOGLE CSE ──────────────────────────────────────
// Exemplos reais de resultados Google:
//   Naruto Uzumaki    → ~500M  → lendário
//   Sana (TWICE)      → ~80M   → épico
//   Personagem médio  → ~10M   → raro
//   Personagem nicho  → ~1M    → incomum
//   Personagem obscuro → <1M   → comum
function calcularRaridade(total: number): string {
  if (total >= 200_000_000) return 'lendario'; // >200M
  if (total >= 50_000_000)  return 'epico';    // >50M
  if (total >= 5_000_000)   return 'raro';     // >5M
  if (total >= 500_000)     return 'incomum';  // >500k
  return 'comum';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = searchParams.get('personagem')?.trim();
  const vinculo    = searchParams.get('vinculo')?.trim() || '';

  if (!personagem) {
    return NextResponse.json({ erro: 'Parâmetro "personagem" obrigatório' }, { status: 400 });
  }

  const chave  = `${personagem}:${vinculo}`.toLowerCase();
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({ raridade: cached.raridade, total: cached.total, cache: true });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;

  if (!apiKey || !cx) {
    return NextResponse.json({ raridade: 'comum', total: 0, sem_api: true });
  }

  try {
    // Busca com personagem + vínculo para maior precisão
    const query = encodeURIComponent(`${personagem}${vinculo ? ' ' + vinculo : ''}`);
    const url   = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=1`;
    const res   = await fetch(url, { cache: 'no-store' });

    if (res.status === 429) {
      return NextResponse.json({ raridade: 'comum', total: 0, quota: true });
    }
    if (!res.ok) throw new Error(`Google API: ${res.status}`);

    const data  = await res.json() as { searchInformation?: { totalResults?: string } };
    const total = parseInt(data?.searchInformation?.totalResults || '0', 10);
    const raridade = calcularRaridade(total);

    console.log(`🔍 [${personagem} / ${vinculo || '-'}]: ${total.toLocaleString()} resultados → ${raridade}`);

    cache.set(chave, { raridade, total, expira: Date.now() + CACHE_TTL });

    return NextResponse.json({ raridade, total, cache: false });
  } catch (error: any) {
    console.error('❌ Erro raridade:', error.message);
    return NextResponse.json({ raridade: 'comum', total: 0, erro: error.message });
  }
}