import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, nome, nascimento, genero, discord_id, avatar_url } = body;

    if (!id || !email || !discord_id) {
      return NextResponse.json({ erro: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from('perfis').insert({
      id,
      email,
      nome,
      nascimento,
      genero,
      discord_id,
      avatar_url: avatar_url || null,
      status: 'offline',
    });

    if (error) {
      console.error('Erro ao criar perfil:', error.message);
      return NextResponse.json({ erro: error.message }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true });
  } catch (error: any) {
    return NextResponse.json({ erro: 'Erro no servidor', detalhes: error.message }, { status: 500 });
  }
}