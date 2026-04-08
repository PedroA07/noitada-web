// app/api/cartas/raridade/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache em memória — evita bater na API do Google repetidamente
const cache = new Map<string, { raridade: string; total: number; expira: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function calcularRaridade(total: number): string {
  if (total >= 500_000_000) return 'lendario';
  if (total >= 100_000_000) return 'epico';
  if (total >= 10_000_000)  return 'raro';
  if (total >= 1_000_000)   return 'incomum';
  return 'comum';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personagem = searchParams.get('personagem')?.trim();
  const vinculo    = searchParams.get('vinculo')?.trim() || '';

  if (!personagem) {
    return NextResponse.json({ erro: 'Parâmetro "personagem" obrigatório' }, { status: 400 });
  }

  const chave = `${personagem}:${vinculo}`.toLowerCase();

  // Retorna do cache se ainda válido
  const cached = cache.get(chave);
  if (cached && cached.expira > Date.now()) {
    return NextResponse.json({
      raridade: cached.raridade,
      total: cached.total,
      cache: true,
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx     = process.env.GOOGLE_CX;

  // Sem credenciais → retorna 'comum' com flag para o front saber
  if (!apiKey || !cx) {
    return NextResponse.json({
      raridade: 'comum',
      total: 0,
      sem_api: true,
    });
  }

  try {
    const query = encodeURIComponent(vinculo ? `${personagem} ${vinculo}` : personagem);
    const url   = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&num=1`;

    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      // quota esgotada ou erro do Google — não quebra o fluxo
      if (res.status === 429) {
        return NextResponse.json({ raridade: 'comum', total: 0, quota: true });
      }
      throw new Error(`Google API retornou ${res.status}`);
    }

    const data = await res.json() as {
      searchInformation?: { totalResults?: string };
    };

    const totalStr = data?.searchInformation?.totalResults || '0';
    const total    = parseInt(totalStr, 10);
    const raridade = calcularRaridade(total);

    cache.set(chave, { raridade, total, expira: Date.now() + CACHE_TTL });

    console.log(`🔍 Raridade [${personagem} / ${vinculo}]: ${total.toLocaleString()} resultados → ${raridade}`);

    return NextResponse.json({ raridade, total, cache: false });

  } catch (error: any) {
    console.error('❌ Erro ao buscar raridade:', error);
    return NextResponse.json({ raridade: 'comum', total: 0, erro: error.message });
  }
}