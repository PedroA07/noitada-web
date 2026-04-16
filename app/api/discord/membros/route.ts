import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Cache em memória — membros: TTL de 60 segundos (lista muda com mais frequência)
const _cache = new Map<string, { data: any; expira: number }>();
const TTL_MEMBROS = 60 * 1000; // 1 minuto

function cacheGet(chave: string) {
  const entry = _cache.get(chave);
  if (entry && entry.expira > Date.now()) return entry.data;
  return null;
}
function cacheSet(chave: string, data: any, ttl = TTL_MEMBROS) {
  _cache.set(chave, { data, expira: Date.now() + ttl });
}

export async function GET() {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  const cached = cacheGet(`membros_${guildId}`);
  if (cached) return NextResponse.json(cached);

  try {
    const resposta = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`,
      { headers: { Authorization: `Bot ${token}` }, cache: 'no-store' },
    );
    if (!resposta.ok)
      return NextResponse.json({ erro: `Discord retornou ${resposta.status}` }, { status: resposta.status });

    const dados = await resposta.json();
    cacheSet(`membros_${guildId}`, dados);
    return NextResponse.json(dados);
  } catch (erro: any) {
    return NextResponse.json({ erro: 'Não foi possível conectar ao Discord.' }, { status: 500 });
  }
}
