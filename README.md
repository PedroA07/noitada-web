# 🌐 NOITADA WEB

Site e dashboard da comunidade NOITADA.

---

## 📁 Estrutura do repositório

```
noitada-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Página inicial
│   ├── globals.css
│   ├── not-found.tsx
│   ├── login/page.tsx
│   ├── cadastro/page.tsx
│   ├── recuperar-senha/page.tsx
│   ├── redefinir-senha/page.tsx
│   ├── dashboard/
│   │   ├── layout.tsx                    # Sidebar + header
│   │   ├── page.tsx                      # Home do dashboard
│   │   ├── bot/page.tsx                  # Config do bot
│   │   ├── membros/page.tsx              # Gerenciar membros
│   │   └── perfil/page.tsx              # Perfil do usuário
│   └── api/discord/
│       ├── dar-cargo/route.ts            # Insere na fila_cargos
│       ├── membros/route.ts
│       ├── cargos/route.ts
│       ├── gerenciar-cargo/route.ts
│       └── moderacao/route.ts
├── lib/
│   └── supabase.ts                       # Cliente browser (anon key)
├── services/
│   ├── auth.ts
│   └── membros.ts
├── .env.example
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## ⚙️ Setup local

```bash
git clone https://github.com/SEU_USUARIO/noitada-web.git
cd noitada-web
npm install
cp .env.example .env.local
# Preencha o .env.local
npm run dev
```

Acesse: http://localhost:3000

---

## 🔑 Variáveis de ambiente (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
NEXT_PUBLIC_DISCORD_GUILD_ID=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
```

---

## 🚀 Deploy na Vercel

1. Conecte o repositório `noitada-web` na Vercel
2. Adicione todas as variáveis em **Settings → Environment Variables**
3. Deploy automático a cada `git push`

```bash
git add .
git commit -m "sua mensagem"
git push
```

---

## 🔗 Integração com o bot

O site não chama o bot diretamente. O fluxo é via Supabase:

```
Cadastro → /api/discord/dar-cargo → INSERT fila_cargos → Bot entrega cargo
```

---

## 🔐 Configurações no Discord Developer Portal

Em OAuth2 → Redirects, adicione:
- http://localhost:3000 (dev)
- https://www.noitadaserver.com.br (produção)

No Supabase → Authentication → Providers → Discord:
- Client ID: Application ID do seu app Discord
- Client Secret: OAuth2 → Client Secret