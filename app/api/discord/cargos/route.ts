import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache em memória — cargos mudam raramente, TTL de 5 minutos
const _cache = new Map<string, { data: any; expira: number }>();
const TTL_CARGOS = 5 * 60 * 1000; // 5 min

function cacheGet(chave: string) {
  const entry = _cache.get(chave);
  if (entry && entry.expira > Date.now()) return entry.data;
  return null;
}
function cacheSet(chave: string, data: any, ttl = TTL_CARGOS) {
  _cache.set(chave, { data, expira: Date.now() + ttl });
}

export async function GET() {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  // Devolve do cache se ainda válido
  const cached = cacheGet(`cargos_${guildId}`);
  if (cached) return NextResponse.json(cached);

  try {
    const resposta = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${token}` }, cache: 'no-store',
    });
    if (!resposta.ok)
      return NextResponse.json({ erro: `Discord retornou ${resposta.status}` }, { status: resposta.status });

    const dados = await resposta.json();
    cacheSet(`cargos_${guildId}`, dados);
    return NextResponse.json(dados);
  } catch (erro: any) {
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

    // Invalida o cache de cargos após criar um novo
    _cache.delete(`cargos_${guildId}`);
    return NextResponse.json(await resposta.json());
  } catch (erro: any) {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
