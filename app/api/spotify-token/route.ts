import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ erro: 'code não informado' }, { status: 400 });
  }

  const clientId = '0d4ee72318ab43e0ba1e5b7c732b2548';
  const clientSecret = '98188cb64b324bbf859ba1bf36361928';
  const redirectUri = 'https://www.noitadaserver.com.br/spotify-callback';

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();

  return NextResponse.json(data);
}