import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Converte valor + unidade para data de expiração ISO
function calcularExpiracao(valor: number, unidade: string): string {
  const agora = new Date();
  if (unidade === 'minutos') agora.setMinutes(agora.getMinutes() + valor);
  else if (unidade === 'horas')  agora.setHours(agora.getHours() + valor);
  else if (unidade === 'dias')   agora.setDate(agora.getDate() + valor);
  return agora.toISOString();
}

export async function POST(req: NextRequest) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  try {
    const { membroId, acao, valor, unidade, apelido } = await req.json();
    if (!membroId || !acao)
      return NextResponse.json({ erro: 'membroId e acao são obrigatórios' }, { status: 400 });

    const baseUrl = `https://discord.com/api/v10/guilds/${guildId}`;
    const headers: HeadersInit = { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' };

    switch (acao) {

      // Expulsar membro do servidor
      case 'kick': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error(`Falha ao expulsar membro (${res.status})`);
        break;
      }

      // Banir membro permanentemente
      case 'ban': {
        const res = await fetch(`${baseUrl}/bans/${membroId}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ delete_message_seconds: 86400, reason: 'Banido via Dashboard NOITADA' }),
        });
        if (!res.ok) throw new Error(`Falha ao banir membro (${res.status})`);
        break;
      }

      // Timeout (suspende mensagens e voz pelo prazo informado)
      case 'timeout': {
        const qtd  = Number(valor) || 5;
        const uni  = unidade || 'minutos';
        const ate  = calcularExpiracao(qtd, uni);
        const res  = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ communication_disabled_until: ate }),
        });
        if (!res.ok) throw new Error(`Falha ao aplicar timeout (${res.status})`);
        break;
      }

      // Remover timeout (liberar membro)
      case 'remove_timeout': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ communication_disabled_until: null }),
        });
        if (!res.ok) throw new Error(`Falha ao remover timeout (${res.status})`);
        break;
      }

      // Mutar microfone no servidor (apenas voz)
      case 'voice_mute': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ mute: true }),
        });
        if (!res.ok) throw new Error(`Falha ao mutar membro (${res.status})`);
        break;
      }

      // Desmutar microfone
      case 'voice_unmute': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ mute: false }),
        });
        if (!res.ok) throw new Error(`Falha ao desmutar membro (${res.status})`);
        break;
      }

      // Alterar apelido
      case 'nickname': {
        const res = await fetch(`${baseUrl}/members/${membroId}`, {
          method: 'PATCH', headers,
          body: JSON.stringify({ nick: apelido ?? '' }),
        });
        if (!res.ok) throw new Error(`Falha ao alterar apelido (${res.status})`);
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
