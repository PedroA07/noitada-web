import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const TTL_MEMBROS = 60; // 1 minuto

export async function GET() {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  const chave = `discord:membros:${guildId}`;

  const cached = await redis.get(chave);
  if (cached) return NextResponse.json(cached);

  try {
    const resposta = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      { headers: { Authorization: `Bot ${token}` }, cache: 'no-store' },
    );
    if (!resposta.ok)
      return NextResponse.json({ erro: `Discord retornou ${resposta.status}` }, { status: resposta.status });

    const dados = await resposta.json();
    await redis.set(chave, dados, { ex: TTL_MEMBROS });
    return NextResponse.json(dados);
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
