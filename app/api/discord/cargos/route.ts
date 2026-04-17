import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const TTL_CARGOS = 5 * 60; // 5 minutos (segundos para o Redis EX)

export async function GET() {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  const chave = `discord:cargos:${guildId}`;

  const cached = await redis.get(chave);
  if (cached) return NextResponse.json(cached);

  try {
    const resposta = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` }, cache: 'no-store',
    });
    if (!resposta.ok)
      return NextResponse.json({ erro: `Discord retornou ${resposta.status}` }, { status: resposta.status });

    const dados = await resposta.json();
    await redis.set(chave, dados, { ex: TTL_CARGOS });
    return NextResponse.json(dados);
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  try {
    const { nome, cor } = await req.json();
    if (!nome) return NextResponse.json({ erro: 'Nome do cargo é obrigatório' }, { status: 400 });

    const colorInt = parseInt((cor || '#000000').replace('#', ''), 16);
    const resposta = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nome, color: colorInt, hoist: true, mentionable: true }),
    });
    if (!resposta.ok)
      return NextResponse.json({ erro: `Erro do Discord: ${resposta.status}` }, { status: resposta.status });

    // Invalida o cache após criar novo cargo
    await redis.del(`discord:cargos:${guildId}`);
    return NextResponse.json(await resposta.json());
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
