import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const TTL_CANAIS = 5 * 60; // 5 minutos

// Tipos de canal Discord relevantes: text, news, threads, forum
const TIPOS_TEXTO = new Set([0, 5, 10, 11, 12, 15]);

export async function GET(req: Request) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const soTexto = searchParams.get('texto') !== 'false';

  const chave = `discord:canais:${guildId}:${soTexto}`;

  const cached = await redis.get(chave);
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

    await redis.set(chave, canais, { ex: TTL_CANAIS });
    return NextResponse.json(canais);
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
