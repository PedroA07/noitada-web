# NOITADA — Plataforma Web

Dashboard administrativo e API para a comunidade **NOITADA** no Discord. Gerencia membros, coleção de cartas de personagens, configurações do bot e integração completa com o Discord.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | Supabase Auth (OAuth Discord) |
| Storage de imagens | Cloudflare R2 |
| Deploy | Vercel |
| Estilização | Tailwind CSS |
| Ícones | Lucide React |

---

## Funcionalidades

- **Cadastro/Login** via Discord OAuth — com definição de senha na finalização do cadastro
- **Dashboard** com painel de membros online (widget Discord)
- **Coleção de Cartas** — CRUD completo com raridade manual, variações, imagens múltiplas, preview em tempo real e preview Discord
- **Configurações do Bot** — cargos, boas-vindas, hierarquias, regras de roll, sistema de spawn
- **Perfil** — edição de nome, gênero, data de nascimento
- **Polling automático** de 30 segundos nas listagens

---

## Estrutura do Projeto

```
noitada-web/
├── app/
│   ├── api/
│   │   ├── cartas/
│   │   │   ├── route.ts                  # CRUD principal de cartas
│   │   │   ├── raridade/route.ts         # Cálculo de raridade via APIs externas (cron)
│   │   │   ├── vinculos/route.ts         # Autocomplete de vínculo/sub-vínculo
│   │   │   └── imagem/route.tsx          # Geração de imagem PNG (@vercel/og)
│   │   ├── discord/
│   │   │   ├── cartas/route.ts           # CRUD de cartas via bot Discord
│   │   │   ├── cartas/upload/route.ts    # Upload de imagem para Cloudflare R2
│   │   │   ├── cargos/route.ts           # Listar/criar cargos no Discord
│   │   │   ├── dar-cargo/route.ts        # Enfileira entrega de cargo (fila_cargos)
│   │   │   ├── gerenciar-cargo/route.ts  # Adicionar/remover cargo de membro
│   │   │   ├── membros/route.ts          # Listar membros do servidor
│   │   │   └── moderação/route.ts        # Ações de moderação (ban, kick, timeout)
│   │   ├── configuracoes-roll/route.ts           # Regras de roll por cargo
│   │   ├── configuracoes-cartas-sistema/route.ts # Config do sistema de spawn
│   │   ├── perfil/criar/route.ts         # Criação de perfil (service role)
│   │   ├── cron/recalcular-raridades/    # Cron semanal (domingo 3h UTC)
│   │   └── spotify-token/route.ts        # Exchange de token Spotify
│   │
│   ├── cadastro/page.tsx    # Cadastro via Discord OAuth
│   ├── login/page.tsx       # Login com e-mail + senha
│   ├── redefinir-senha/     # Redefinição de senha
│   ├── dashboard/
│   │   ├── layout.tsx       # Sidebar + header com sessão
│   │   ├── page.tsx         # Painel principal (membros online, widget Discord)
│   │   ├── cartas/page.tsx  # Gestão da coleção de cartas
│   │   ├── membros/page.tsx # Lista de membros do servidor
│   │   ├── bot/page.tsx     # Configurações do bot Discord
│   │   └── perfil/page.tsx  # Edição do perfil do usuário
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page pública
│
├── lib/
│   ├── supabase.ts          # Cliente Supabase (anon key)
│   ├── r2.ts                # Cliente Cloudflare R2 (S3-compatible)
│   ├── components.tsx       # CalendarPicker, DropdownPicker
│   └── services/
│       ├── auth.ts          # vincularDiscord, finalizarCadastro, entrarComEmail, sair
│       └── membros.ts       # Helpers de membros Discord
│
├── sql/
│   ├── schema.sql                      # Schema completo (criar do zero)
│   └── add_variacoes_subvinculo.sql    # Migração incremental (variações)
│
├── public/
│   ├── videos/background.mp4
│   └── images/logo.png
│
├── vercel.json              # Cron jobs (domingo 3h UTC)
└── next.config.js           # Domínios de imagens permitidos
```

---

## Banco de Dados

> O schema completo está em [`sql/schema.sql`](sql/schema.sql). Execute-o inteiro no **Supabase Studio → SQL Editor** para criar todas as tabelas, índices, RLS e funções de uma vez.

### Tabelas

#### `perfis`
Perfis dos usuários cadastrados via Discord OAuth.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` PK | Mesmo ID do `auth.users` |
| `email` | `text` | E-mail do usuário |
| `nome` | `text` | Nome de exibição |
| `nascimento` | `date` | Data de nascimento |
| `genero` | `text` | `masculino` \| `feminino` \| `nao_informar` \| `outro` |
| `discord_id` | `text` UNIQUE | ID do usuário no Discord |
| `avatar_url` | `text` | URL do avatar (Discord CDN) |
| `status` | `text` | `online` \| `idle` \| `dnd` \| `offline` |
| `criado_em` | `timestamptz` | Data de criação |
| `atualizado_em` | `timestamptz` | Última atualização (auto) |

---

#### `cartas`
Coleção de cartas de personagens com suporte a variações.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` PK | ID único da carta |
| `nome` | `text` | Nome da carta (igual ao personagem) |
| `personagem` | `text` | Nome do personagem |
| `vinculo` | `text` | Obra de origem (ex: `One Piece`) |
| `sub_vinculo` | `text` | Subdivisão opcional (ex: `Arco de Marineford`) |
| `categoria` | `text` | `anime` \| `serie` \| `filme` \| `desenho` \| `jogo` \| `musica` \| `hq` \| `outro` |
| `raridade` | `text` | `comum` \| `incomum` \| `raro` \| `epico` \| `lendario` |
| `genero` | `text` | `masculino` \| `feminino` \| `outros` |
| `imagem_url` | `text` | URL da imagem principal (cópia de `imagens[0]`) |
| `imagens` | `text[]` | Array de até 10 URLs de imagens |
| `imagem_r2_key` | `text` | Chave do arquivo no Cloudflare R2 |
| `imagem_offset_x` | `integer` | Posição X da imagem na carta (0–100, padrão 50) |
| `imagem_offset_y` | `integer` | Posição Y da imagem na carta (0–100, padrão 50) |
| `imagem_zoom` | `integer` | Zoom da imagem (100–300, padrão 100) |
| `descricao` | `text` | Descrição opcional |
| `pontuacao` | `integer` | Pontuação calculada (raridade + hash do nome) |
| `ranking` | `integer` | Posição no ranking geral |
| `ativa` | `boolean` | `false` = soft-delete |
| `criado_por` | `uuid` FK | Referência ao `auth.users` |
| `criado_em` | `timestamptz` | Data de criação |
| `carta_principal_id` | `uuid` FK | Aponta para a carta-base do grupo de variações |
| `variacao_ordem` | `integer` | Ordem dentro do grupo (0 = principal, 1, 2... = variações) |

**Sistema de raridade:**

| Raridade | Cor | Spawn | Pts base |
|---|---|---|---|
| Comum | Cinza | 50% | 1 |
| Incomum | Verde | 25% | 10 |
| Raro | Azul | 15% | 50 |
| Épico | Roxo | 7% | 200 |
| Lendário | Dourado | 3% | 1000 |

**Sistema de variações:** uma carta pode ter variações (ex: Goku base → Goku SSJ → Goku UI). A carta raiz tem `carta_principal_id = NULL`. As variações apontam para ela via `carta_principal_id`. No dashboard, o grupo é exibido junto com navegação por pontos e controles de ordem.

---

#### `configuracoes_servidor`
Configurações globais do servidor Discord (única linha por `guild_id`).

| Coluna | Tipo | Descrição |
|---|---|---|
| `guild_id` | `text` UNIQUE | ID do servidor Discord |
| `cargo_membro_id` | `text` | ID do cargo Membro |
| `cargo_staff_id` | `text` | ID do cargo Staff |
| `cargo_admin_id` | `text` | ID do cargo Admin |
| `canal_boas_vindas_id` | `text` | Canal de boas-vindas |
| `titulo_boas_vindas` | `text` | Título da mensagem de boas-vindas |
| `descricao_boas_vindas` | `text` | Descrição do embed de boas-vindas |
| `mensagem_boas_vindas` | `text` | Mensagem de texto simples |
| `cor_boas_vindas` | `text` | Cor hex do embed (padrão `#EC4899`) |
| `banner_boas_vindas` | `text` | URL do banner |
| `mostrar_avatar_boas_vindas` | `boolean` | Exibir avatar do membro (padrão `true`) |
| `cargos_comuns` | `text[]` | IDs dos cargos comuns |
| `quem_pode_dar_comuns` | `text[]` | IDs de cargos que podem conceder comuns |
| `cargos_moderacao` | `text[]` | IDs dos cargos de moderação |
| `quem_pode_dar_moderacao` | `text[]` | IDs de cargos que podem conceder moderação |

---

#### `configuracoes_roll`
Regras de roll de cartas por cargo. Permite cooldowns e limites diferentes por nível de cargo.

| Coluna | Tipo | Descrição |
|---|---|---|
| `guild_id` | `text` | ID do servidor |
| `cargo_id` | `text` | ID do cargo Discord |
| `cargo_nome` | `text` | Nome do cargo (cache) |
| `cooldown_valor` | `integer` | Valor do cooldown (padrão 30) |
| `cooldown_unidade` | `text` | `minutos` \| `horas` \| `dias` |
| `rolls_por_periodo` | `integer` | Quantidade de rolls permitidos por período |
| `cartas_por_roll` | `integer` | Cartas sorteadas por roll |
| `capturas_por_dia` | `integer` | Limite de capturas diárias |
| `cooldown_captura_segundos` | `integer` | Cooldown entre capturas (segundos) |

Constraint única: `(guild_id, cargo_id)` — upsert via conflito.

---

#### `configuracoes_cartas_sistema`
Parâmetros do sistema automático de spawn de cartas no Discord.

| Coluna | Tipo | Descrição |
|---|---|---|
| `guild_id` | `text` UNIQUE | ID do servidor |
| `intervalo_spawn_minutos` | `integer` | Intervalo entre spawns automáticos |
| `canal_spawn_id` | `text` | Canal onde as cartas aparecem |
| `reset_capturas_hora` | `integer` | Hora do reset diário de capturas (0–23) |
| `reset_capturas_minuto` | `integer` | Minuto do reset diário (0–59) |
| `ativo` | `boolean` | Liga/desliga o sistema de spawn |

---

#### `fila_cargos`
Fila assíncrona para entrega de cargos Discord após cadastro.

| Coluna | Tipo | Descrição |
|---|---|---|
| `discord_id` | `text` | ID do usuário no Discord |
| `acao` | `text` | `dar_cargo_membro` \| `remover_cargo_membro` |
| `status` | `text` | `pendente` \| `concluido` \| `erro` |
| `tentativas` | `integer` | Número de tentativas de processamento |
| `erro_msg` | `text` | Mensagem de erro (se houver) |
| `criado_em` | `timestamptz` | Data de criação |
| `processado_em` | `timestamptz` | Data de processamento |

---

### Funções RPC

| Função | Descrição |
|---|---|
| `recalcular_ranking_cartas()` | Recalcula o `ranking` de todas as cartas ativas ordenadas por `pontuacao DESC` |

---

## API Routes

### Cartas

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/cartas` | Lista cartas com paginação e filtros |
| `POST` | `/api/cartas` | Cria nova carta |
| `PATCH` | `/api/cartas` | Atualiza carta existente |
| `DELETE` | `/api/cartas?id=<id>` | Desativa carta (soft-delete) |
| `GET` | `/api/cartas/vinculos` | Sugestões de autocomplete para vínculo/sub-vínculo |
| `GET` | `/api/cartas/imagem` | Gera imagem PNG da carta (usado pelo bot) |

**Parâmetros do GET `/api/cartas`:**

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `pagina` | `number` | Página (padrão 1) |
| `ordenar` | `string` | `criado_em` \| `pontuacao` \| `ranking` \| `raridade` |
| `ordemDir` | `string` | `asc` \| `desc` |
| `busca` | `string` | Busca em nome, personagem e vínculo |
| `categoria` | `string` | Filtro de categoria |
| `genero` | `string` | Filtro de gênero |
| `vinculo` | `string` | Filtro por vínculo (partial match) |
| `so_principais` | `true` | Retorna apenas cartas sem `carta_principal_id` |
| `principal_ids` | `string` | IDs separados por vírgula — retorna variações |

### Discord

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/discord/membros` | Lista membros com cargo Membro |
| `GET` | `/api/discord/cargos` | Lista todos os cargos do servidor |
| `POST` | `/api/discord/cargos` | Cria novo cargo no Discord |
| `POST` | `/api/discord/dar-cargo` | Enfileira entrega do cargo Membro |
| `POST` | `/api/discord/gerenciar-cargo` | Adiciona ou remove cargo de um membro |
| `POST` | `/api/discord/moderação` | Executa ação de moderação (ban, kick, timeout) |
| `GET` | `/api/discord/cartas` | Lista cartas (uso pelo bot) |
| `POST` | `/api/discord/cartas` | Cria carta via bot |
| `PATCH` | `/api/discord/cartas` | Atualiza carta via bot |
| `DELETE` | `/api/discord/cartas?id=<id>` | Remove carta via bot |
| `POST` | `/api/discord/cartas/upload` | Faz upload de imagem para o R2 |

### Configurações

| Método | Rota | Descrição |
|---|---|---|
| `GET/POST` | `/api/configuracoes-roll` | Lê/salva regras de roll por cargo |
| `DELETE` | `/api/configuracoes-roll?id=<id>` | Remove regra de roll |
| `GET/POST` | `/api/configuracoes-cartas-sistema` | Lê/salva config do sistema de spawn |

### Outros

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/perfil/criar` | Cria perfil (service role, bypassa RLS) |
| `GET` | `/api/cron/recalcular-raridades` | Cron semanal — recalcula raridades de todas as cartas |
| `GET` | `/api/spotify-token` | Exchange de código Spotify por access token |

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Discord
DISCORD_BOT_TOKEN=<token-do-bot>
DISCORD_GUILD_ID=<id-do-servidor>
NEXT_PUBLIC_DISCORD_GUILD_ID=<id-do-servidor>

# Google Custom Search (cálculo de raridade via cron)
GOOGLE_API_KEY=<chave-api-google>
GOOGLE_CX=<cx-do-mecanismo-de-busca>

# reCAPTCHA (opcional)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<site-key>
```

---

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# editar .env.local com seus valores

# 3. Criar o banco de dados
# Abra: Supabase Studio → SQL Editor
# Cole e execute o conteúdo de sql/schema.sql

# 4. Iniciar em desenvolvimento
npm run dev
```

---

## Configuração do Supabase Auth

No painel do Supabase, em **Authentication → Providers → Discord**:

1. Habilitar Discord OAuth
2. Inserir **Client ID** e **Client Secret** do aplicativo Discord
3. Adicionar Redirect URL: `https://<seu-dominio>/auth/v1/callback`

Em **Authentication → URL Configuration**:
- Site URL: `https://<seu-dominio>`
- Redirect URLs: `https://<seu-dominio>/**`

---

## Fluxo de Cadastro

```
Usuário clica "Vincular Discord"
    ↓
supabase.auth.signInWithOAuth({ provider: 'discord' })
    ↓
Redireciona para Discord → usuário autoriza
    ↓
Discord redireciona de volta para /cadastro
    ↓
onAuthStateChange detecta sessão Discord
    ↓
Formulário pré-preenchido (nome, e-mail Discord)
    ↓
Usuário preenche campos restantes + cria senha
    ↓
finalizarCadastro():
    1. supabase.auth.updateUser({ email, password })
    2. POST /api/perfil/criar  →  salva em perfis
    3. POST /api/discord/dar-cargo  →  enfileira cargo Membro
    ↓
E-mail de confirmação enviado pelo Supabase
```

---

## Sistema de Cartas

### Raridade

A raridade é definida **manualmente** pelo criador da carta ao cadastrá-la. Cada raridade tem um peso de spawn e pontuação base:

```
Lendário (3%)  → 1000 pts base
Épico    (7%)  →  200 pts base
Raro     (15%) →   50 pts base
Incomum  (25%) →   10 pts base
Comum    (50%) →    1 pts base
```

A pontuação final é calculada como: `ptsBase + (hash(personagem + vinculo) % 50)`

O cron semanal em `/api/cron/recalcular-raridades` consulta APIs externas (Wikipedia, Jikan, AniList, OMDB, RAWG, etc.) para sugerir atualizações de raridade baseadas em popularidade.

### Variações

Uma carta pode ter variações — por exemplo, Goku com diferentes formas. Todas compartilham o mesmo `personagem` e `vinculo`. A carta-base tem `carta_principal_id = NULL`. As variações apontam para ela e são ordenadas por `variacao_ordem`.

No dashboard, o grupo inteiro é exibido como uma única entrada no grid com navegação por pontos para alternar entre as cartas do grupo. Em modo de edição, setas permitem reordenar as variações.

### Imagens

- Até **10 imagens por carta** (array `imagens[]`)
- Reordenáveis por drag-and-drop no formulário
- Posicionamento ajustável (offset X/Y + zoom) salvo no banco
- Suporte a GIFs animados
- Upload direto para **Cloudflare R2** via `/api/discord/cartas/upload`

---

## Cron Jobs

| Schedule | Rota | Ação |
|---|---|---|
| `0 3 * * 0` (domingo 3h UTC) | `/api/cron/recalcular-raridades` | Recalcula raridades de todas as cartas ativas usando APIs externas |

Configurado em `vercel.json`.

---

## Migrações

| Arquivo | Quando usar |
|---|---|
| `sql/schema.sql` | Banco novo — cria tudo do zero |
| `sql/add_variacoes_subvinculo.sql` | Banco existente — adiciona colunas de variações |
