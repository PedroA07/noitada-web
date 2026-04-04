import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId) return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  try {
    const { membroId, acao, tempo, unidade, apelido } = await req.json();
    if (!membroId || !acao) return NextResponse.json({ erro: 'membroId e acao são obrigatórios' }, { status: 400 });

    const baseUrl = `https://discord.com/api/v10/guilds/${guildId}`;
    const headers: HeadersInit = { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' };

    switch (acao) {
      case 'kick': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Falha ao expulsar membro');
        break;
      }
      case 'ban': {
        const res = await fetch(`${baseUrl}/bans/${membroId}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ delete_message_days: 1, reason: 'Banido via Dashboard NOITADA' }),
        });
        if (!res.ok) throw new Error('Falha ao banir membro');
        break;
      }
      case 'mute': {
        const now = new Date();
        if (tempo && unidade) {
          const val = parseInt(tempo);
          if (unidade === 'minutos') now.setMinutes(now.getMinutes() + val);
          if (unidade === 'horas') now.setHours(now.getHours() + val);
          if (unidade === 'dias') now.setDate(now.getDate() + val);
        } else {
          now.setDate(now.getDate() + 27);
        }
        const res = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ communication_disabled_until: now.toISOString() }),
        });
        if (!res.ok) throw new Error('Falha ao silenciar membro');
        break;
      }
      case 'nickname': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers, body: JSON.stringify({ nick: apelido }),
        });
        if (!res.ok) throw new Error('Falha ao alterar apelido');
        break;
      }
      default:
        return NextResponse.json({ erro: 'Ação inválida' }, { status: 400 });
    }
    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}