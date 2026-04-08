// app/api/cartas/imagem/route.ts
// Gera uma imagem PNG do card no formato 9:16 usando @vercel/og
// O bot usa a URL desta rota como setImage() no embed
// GIFs animados: se a carta tiver .gif, retorna redirect para a URL original
// (Discord renderiza GIFs animados nativamente via setImage)

import { ImageResponse } from 'next/og';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'edge'; // necessário para @vercel/og

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Largura e altura do card — proporção 9:16
const W = 360;
const H = 640;

const CORES: Record<string, { hex: string; grad1: string; grad2: string; glow: string }> = {
  comum:    { hex: '#9CA3AF', grad1: '#374151', grad2: '#1F2937', glow: '#9CA3AF33' },
  incomum:  { hex: '#22C55E', grad1: '#14532D', grad2: '#052e16', glow: '#22C55E44' },
  raro:     { hex: '#3B82F6', grad1: '#1E3A8A', grad2: '#0f172a', glow: '#3B82F644' },
  epico:    { hex: '#A855F7', grad1: '#581C87', grad2: '#1e0a3c', glow: '#A855F755' },
  lendario: { hex: '#F59E0B', grad1: '#78350F', grad2: '#1c0a00', glow: '#F59E0B66' },
};

const LABEL_RARIDADE: Record<string, string> = {
  comum: 'COMUM', incomum: 'INCOMUM', raro: 'RARO', epico: 'ÉPICO', lendario: 'LENDÁRIO',
};

const LABEL_CATEGORIA: Record<string, string> = {
  anime: 'Anime', serie: 'Série', filme: 'Filme',
  desenho: 'Desenho', jogo: 'Jogo', musica: 'Música', outro: 'Outro',
};

function calcPts(raridade: string, nome: string, vinculo: string): number {
  const bases: Record<string, number> = {
    comum: 1, incomum: 10, raro: 50, epico: 200, lendario: 1000,
  };
  const base = bases[raridade] || 1;
  let h = 0;
  const s = (nome + vinculo).toLowerCase();
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return base + (Math.abs(h) % 50);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cartaId = searchParams.get('id');

  if (!cartaId) {
    return NextResponse.json({ erro: 'id obrigatório' }, { status: 400 });
  }

  // Busca a carta no banco
  const { data: carta, error } = await supabaseAdmin
    .from('cartas')
    .select('personagem, vinculo, raridade, categoria, genero, imagem_url, descricao')
    .eq('id', cartaId)
    .eq('ativa', true)
    .single();

  if (error || !carta) {
    return NextResponse.json({ erro: 'Carta não encontrada' }, { status: 404 });
  }

  // GIFs: redireciona para a URL original — Discord anima GIFs em setImage()
  if (carta.imagem_url?.toLowerCase().endsWith('.gif')) {
    return NextResponse.redirect(carta.imagem_url);
  }

  const cor      = CORES[carta.raridade] || CORES.comum;
  const label    = LABEL_RARIDADE[carta.raridade] || 'COMUM';
  const catLabel = LABEL_CATEGORIA[carta.categoria] || carta.categoria;
  const pts      = calcPts(carta.raridade, carta.personagem, carta.vinculo);
  const isLend   = carta.raridade === 'lendario';

  // Altura da área de imagem = 75% do card total (proporcão 9:16 do conteúdo)
  const imgAreaH = Math.round(H * 0.68);

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(170deg, ${cor.grad1}, ${cor.grad2})`,
          border: `2px solid ${cor.hex}55`,
          borderRadius: 20,
          overflow: 'hidden',
          fontFamily: 'sans-serif',
          boxShadow: isLend
            ? `0 0 60px ${cor.glow}, 0 0 120px ${cor.glow}`
            : `0 0 30px ${cor.glow}`,
          position: 'relative',
        }}
      >
        {/* Linha brilhante no topo */}
        <div style={{
          height: 3,
          width: '100%',
          background: `linear-gradient(90deg, transparent, ${cor.hex}, transparent)`,
        }} />

        {/* Header — raridade + categoria */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: `1px solid ${cor.hex}33`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: cor.hex,
              boxShadow: `0 0 8px ${cor.hex}`,
            }} />
            <span style={{ fontSize: 11, color: cor.hex, fontWeight: 900, letterSpacing: 2 }}>
              {label}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#6B7280' }}>{catLabel}</span>
        </div>

        {/* ÁREA DA IMAGEM — proporção 9:16 dominante */}
        <div style={{
          width: '100%',
          height: imgAreaH,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: carta.imagem_url ? 'transparent' : `linear-gradient(135deg, ${cor.hex}14, ${cor.hex}33)`,
        }}>
          {carta.imagem_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={carta.imagem_url}
              alt={carta.personagem}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 30%',
              }}
            />
          ) : (
            <div style={{
              fontSize: 64,
              opacity: 0.15,
              color: cor.hex,
            }}>🃏</div>
          )}

          {/* Overlay gradiente inferior para legibilidade */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 80,
            background: `linear-gradient(to top, ${cor.grad2}EE, transparent)`,
          }} />

          {/* Badge lendário */}
          {isLend && (
            <div style={{
              position: 'absolute',
              top: 10, left: 10,
              background: '#F59E0B22',
              border: '1px solid #F59E0B88',
              borderRadius: 8,
              padding: '3px 8px',
              fontSize: 9,
              color: '#F59E0B',
              fontWeight: 900,
              letterSpacing: 2,
            }}>
              ✦ LENDÁRIO
            </div>
          )}
        </div>

        {/* Info — nome + vínculo */}
        <div style={{
          padding: '12px 16px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flex: 1,
        }}>
          <div style={{
            fontSize: 20,
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}>
            {carta.personagem}
          </div>
          <div style={{
            fontSize: 11,
            color: cor.hex,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            {carta.vinculo}
          </div>
          {carta.descricao && (
            <div style={{
              fontSize: 10,
              color: '#6B7280',
              marginTop: 6,
              lineHeight: 1.4,
              borderTop: `1px solid ${cor.hex}22`,
              paddingTop: 6,
            }}>
              {carta.descricao.length > 80
                ? carta.descricao.slice(0, 80) + '…'
                : carta.descricao}
            </div>
          )}
        </div>

        {/* Footer — pontuação */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.4)',
          borderTop: `1px solid ${cor.hex}22`,
        }}>
          <span style={{ fontSize: 9, color: '#4B5563', letterSpacing: 1 }}>PONTUAÇÃO</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: cor.hex }}>
            {pts.toLocaleString('pt-BR')} pts
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    }
  );
}