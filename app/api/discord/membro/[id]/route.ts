import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  try {
    const resposta = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${params.id}`,
      { headers: { Authorization: `Bot ${token}` }, cache: 'no-store' },
    );
    if (!resposta.ok)
      return NextResponse.json({ erro: `Discord: ${resposta.status}` }, { status: resposta.status });
    return NextResponse.json(await resposta.json());
  } catch {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
