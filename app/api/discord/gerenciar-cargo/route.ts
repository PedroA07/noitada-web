import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  try {
    const { membroId, cargoId, acao } = await req.json();
    if (!membroId || !cargoId || !acao) return NextResponse.json({ erro: 'membroId, cargoId e acao são obrigatórios' }, { status: 400 });

    const url = `https://discord.com/api/v10/guilds/${guildId}/members/${membroId}/roles/${cargoId}`;
    const response = await fetch(url, {
      method: acao === 'add' ? 'PUT' : 'DELETE',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ erro: `Erro do Discord: ${response.status}`, detalhes: errorText }, { status: response.status });
    }
    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    return NextResponse.json({ erro: 'Erro interno', detalhes: error.message }, { status: 500 });
  }
}