import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const arquivo = formData.get('imagem') as File;
    const cartaId = formData.get('cartaId') as string | null;
    const chaveAntigaParaRemover = formData.get('chaveAntiga') as string | null;

    if (!arquivo) {
      return NextResponse.json({ erro: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const extensao = arquivo.name.split('.').pop()?.toLowerCase();
    const tiposPermitidos = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!extensao || !tiposPermitidos.includes(extensao)) {
      return NextResponse.json(
        { erro: 'Formato não permitido. Use JPG, PNG, WEBP ou GIF.' },
        { status: 400 }
      );
    }

    if (arquivo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { erro: 'Imagem muito grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // Remove imagem antiga do R2 se existir
    if (chaveAntigaParaRemover) {
      try {
        await r2.send(new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: chaveAntigaParaRemover,
        }));
      } catch (e) {
        console.warn('Não foi possível remover imagem antiga:', e);
      }
    }

    const chave = `cartas/${randomUUID()}.${extensao}`;
    const buffer = Buffer.from(await arquivo.arrayBuffer());

    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: chave,
      Body: buffer,
      ContentType: arquivo.type,
      CacheControl: 'public, max-age=31536000',
    }));

    const urlPublica = `${R2_PUBLIC_URL}/${chave}`;

    // Atualiza no banco se cartaId foi informado
    if (cartaId) {
      await supabaseAdmin
        .from('cartas')
        .update({ imagem_url: urlPublica, imagem_r2_key: chave })
        .eq('id', cartaId);
    }

    return NextResponse.json({ url: urlPublica, chave });
  } catch (error: any) {
    console.error('Erro no upload R2:', error);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }
}