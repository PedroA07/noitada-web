import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const token   = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!token || !guildId)
    return NextResponse.json({ erro: 'Faltam variáveis de ambiente' }, { status: 500 });

  try {
    const {
      canalId,
      titulo,
      cor,
      cargos_solidos,       // [{ id, nome, color }]
      cargos_gradientes,    // [{ id, nome, gradiente }]
    } = await req.json();

    if (!canalId)
      return NextResponse.json({ erro: 'canalId é obrigatório' }, { status: 400 });

    // Monta menções para roles sólidas
    const mencoesS = (cargos_solidos ?? [])
      .map((c: any) => `<@&${c.id}>`)
      .join(' ');

    // Monta menções para roles gradiente
    const mencoesG = (cargos_gradientes ?? [])
      .map((c: any) => `<@&${c.id}>`)
      .join(' ');

    const fields = [];
    if (mencoesS)
      fields.push({ name: '🎨 Cores Sólidas', value: mencoesS, inline: false });
    if (mencoesG)
      fields.push({ name: '✨ Gradientes', value: mencoesG, inline: false });

    const embed = {
      title:  titulo || '🎨 Cargos de Cor',
      color:  cor ? parseInt((cor as string).replace('#', ''), 16) : 0xEC4899,
      fields,
      footer: { text: 'NOITADA · Sistema de Cores' },
      timestamp: new Date().toISOString(),
    };

    const res = await fetch(`https://discord.com/api/v10/channels/${canalId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ erro: `Discord ${res.status}: ${err}` }, { status: res.status });
    }

    return NextResponse.json({ sucesso: true });
  } catch (e: any) {
    return NextResponse.json({ erro: e.message }, { status: 500 });
  }
}
