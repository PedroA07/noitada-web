import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache em memória — canais mudam raramente, TTL de 5 minutos
const _cache = new Map<string, { data: any; expira: number }>();
const TTL = 5 * 60 * 1000;

function cacheGet(chave: string) {
  const entry = _cache.get(chave);
  if (entry && entry.expira > Date.now()) return entry.data;
  return null;
}
function cacheSet(chave: string, data: any) {
  _cache.set(chave, { data, expira: Date.now() + TTL });
}

// Tipos de canal Discord relevantes
const TIPOS_TEXTO = new Set([0, 5, 10, 11, 12, 15]); // text, news, threads, forum

export async function GET(req: Request) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const soTexto = searchParams.get('texto') !== 'false'; // padrão: só canais de texto

  const chave = `canais_${guildId}_${soTexto}`;
  const cached = cacheGet(chave);
  if (cached) return NextResponse.json(cached);

  try {
    const resposta = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      { headers: { Authorization: `Bot ${token}` }, cache: 'no-store' },
    );
    if (!resposta.ok)
      return NextResponse.json({ erro: `Discord retornou ${resposta.status}` }, { status: resposta.status });

    let canais = await resposta.json();

    if (soTexto) {
      canais = canais
        .filter((c: any) => TIPOS_TEXTO.has(c.type))
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));
    }

    cacheSet(chave, canais);
    return NextResponse.json(canais);
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
