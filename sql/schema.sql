-- ============================================================
--  NOITADA — Schema completo do banco de dados (Supabase/PostgreSQL)
--  Gerado em: 2026-04-10
--  Execute este arquivo inteiro no Supabase Studio > SQL Editor
--  para criar toda a estrutura do zero.
-- ============================================================

-- ─── EXTENSÕES ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
--  1. PERFIS
--  Perfis de usuários vinculados ao auth.users do Supabase.
--  Criado na finalização do cadastro via Discord OAuth.
-- ============================================================
CREATE TABLE IF NOT EXISTS perfis (
  id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  nome        text,
  nascimento  date,
  genero      text        CHECK (genero IN ('masculino', 'feminino', 'nao_informar', 'outro')),
  discord_id  text        NOT NULL UNIQUE,
  avatar_url  text,
  status      text        NOT NULL DEFAULT 'offline'
                          CHECK (status IN ('online', 'idle', 'dnd', 'offline')),
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

-- Atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tg_perfis_atualizado
  BEFORE UPDATE ON perfis
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê o próprio perfil"
  ON perfis FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza o próprio perfil"
  ON perfis FOR UPDATE USING (auth.uid() = id);


-- ============================================================
--  2. CARTAS
--  Coleção de cartas de personagens com suporte a variações
--  (ex.: Goku base, Goku SSJ, Goku Ultra Instinto).
-- ============================================================
CREATE TABLE IF NOT EXISTS cartas (
  id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                text        NOT NULL,
  personagem          text        NOT NULL,
  vinculo             text        NOT NULL,           -- Série/jogo/filme de origem
  sub_vinculo         text,                           -- Arco, temporada, edição (opcional)
  categoria           text        NOT NULL
                                  CHECK (categoria IN ('anime','serie','filme','desenho','jogo','musica','hq','outro')),
  raridade            text        NOT NULL DEFAULT 'comum'
                                  CHECK (raridade IN ('comum','incomum','raro','epico','lendario')),
  genero              text        NOT NULL DEFAULT 'outros'
                                  CHECK (genero IN ('masculino','feminino','outros')),
  imagem_url          text,                           -- URL da imagem principal (cache da 1ª de imagens[])
  imagens             text[]      NOT NULL DEFAULT '{}', -- Array de URLs (máx 10)
  imagem_r2_key       text,                           -- Chave no Cloudflare R2 (upload direto)
  imagem_offset_x     integer     NOT NULL DEFAULT 50,  -- Posição X da imagem (0–100%)
  imagem_offset_y     integer     NOT NULL DEFAULT 50,  -- Posição Y da imagem (0–100%)
  imagem_zoom         integer     NOT NULL DEFAULT 100, -- Zoom da imagem (100–300%)
  descricao           text,
  pontuacao           integer     NOT NULL DEFAULT 0,
  ranking             integer,
  ativa               boolean     NOT NULL DEFAULT true,
  criado_por          uuid        REFERENCES auth.users(id),
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em       timestamptz NOT NULL DEFAULT now(),

  -- Variações: carta_principal_id aponta para a carta "base" do grupo
  carta_principal_id  uuid        REFERENCES cartas(id) ON DELETE SET NULL,
  variacao_ordem      integer     NOT NULL DEFAULT 0   -- 0 = principal, 1+ = variações em ordem
);

CREATE TRIGGER tg_cartas_atualizado
  BEFORE UPDATE ON cartas
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_cartas_ativa          ON cartas(ativa);
CREATE INDEX IF NOT EXISTS idx_cartas_vinculo        ON cartas(vinculo);
CREATE INDEX IF NOT EXISTS idx_cartas_raridade       ON cartas(raridade);
CREATE INDEX IF NOT EXISTS idx_cartas_categoria      ON cartas(categoria);
CREATE INDEX IF NOT EXISTS idx_cartas_pontuacao      ON cartas(pontuacao DESC);
CREATE INDEX IF NOT EXISTS idx_cartas_principal_id   ON cartas(carta_principal_id)
  WHERE carta_principal_id IS NOT NULL;

-- RLS — cartas são públicas para leitura
ALTER TABLE cartas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cartas ativas são públicas"
  ON cartas FOR SELECT USING (ativa = true);

CREATE POLICY "Usuário autenticado insere carta"
  ON cartas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuário autenticado atualiza carta"
  ON cartas FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ── RPC: recalcula ranking de todas as cartas ativas ─────────
CREATE OR REPLACE FUNCTION recalcular_ranking_cartas()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  rec   RECORD;
  pos   integer := 1;
BEGIN
  FOR rec IN
    SELECT id FROM cartas
    WHERE ativa = true
    ORDER BY pontuacao DESC NULLS LAST
  LOOP
    UPDATE cartas SET ranking = pos WHERE id = rec.id;
    pos := pos + 1;
  END LOOP;
END;
$$;


-- ============================================================
--  3. CONFIGURACOES_SERVIDOR
--  Configurações globais do servidor Discord:
--  cargos padrão, boas-vindas, hierarquias de cargos.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes_servidor (
  id                        uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id                  text        NOT NULL UNIQUE,

  -- Cargos fixos
  cargo_membro_id           text,
  cargo_staff_id            text,
  cargo_admin_id            text,

  -- Canal e mensagem de boas-vindas
  canal_boas_vindas_id      text,
  titulo_boas_vindas        text,
  descricao_boas_vindas     text,
  mensagem_boas_vindas      text,
  cor_boas_vindas           text        DEFAULT '#EC4899',
  banner_boas_vindas        text,
  mostrar_avatar_boas_vindas boolean    NOT NULL DEFAULT true,

  -- Hierarquias de cargos (arrays de IDs Discord)
  cargos_comuns             text[]      NOT NULL DEFAULT '{}',
  quem_pode_dar_comuns      text[]      NOT NULL DEFAULT '{}',
  cargos_moderacao          text[]      NOT NULL DEFAULT '{}',
  quem_pode_dar_moderacao   text[]      NOT NULL DEFAULT '{}',

  atualizado_em             timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tg_config_servidor_atualizado
  BEFORE UPDATE ON configuracoes_servidor
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

ALTER TABLE configuracoes_servidor ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config servidor — autenticados leem"
  ON configuracoes_servidor FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Config servidor — autenticados escrevem"
  ON configuracoes_servidor FOR ALL USING (auth.uid() IS NOT NULL);


-- ============================================================
--  4. CONFIGURACOES_ROLL
--  Regras de roll de cartas por cargo do Discord.
--  Cada cargo pode ter cooldown, limite de rolls e cartas por roll distintos.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes_roll (
  id                      uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id                text    NOT NULL,
  cargo_id                text    NOT NULL,
  cargo_nome              text    NOT NULL,
  cooldown_valor          integer NOT NULL DEFAULT 30,
  cooldown_unidade        text    NOT NULL DEFAULT 'minutos'
                                  CHECK (cooldown_unidade IN ('minutos','horas','dias')),
  rolls_por_periodo       integer NOT NULL DEFAULT 5,
  cartas_por_roll         integer NOT NULL DEFAULT 1,
  capturas_por_dia        integer NOT NULL DEFAULT 10,
  cooldown_captura_segundos integer NOT NULL DEFAULT 30,

  UNIQUE (guild_id, cargo_id)
);

ALTER TABLE configuracoes_roll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roll config — autenticados"
  ON configuracoes_roll FOR ALL USING (auth.uid() IS NOT NULL);


-- ============================================================
--  5. CONFIGURACOES_CARTAS_SISTEMA
--  Configurações do sistema automático de spawn de cartas no Discord.
-- ============================================================
CREATE TABLE IF NOT EXISTS configuracoes_cartas_sistema (
  id                        uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id                  text        NOT NULL UNIQUE,
  intervalo_spawn_minutos   integer     NOT NULL DEFAULT 60,
  canal_spawn_id            text        NOT NULL DEFAULT '',
  reset_capturas_hora       integer     NOT NULL DEFAULT 0  CHECK (reset_capturas_hora BETWEEN 0 AND 23),
  reset_capturas_minuto     integer     NOT NULL DEFAULT 0  CHECK (reset_capturas_minuto BETWEEN 0 AND 59),
  ativo                     boolean     NOT NULL DEFAULT true,
  atualizado_em             timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tg_config_cartas_sistema_atualizado
  BEFORE UPDATE ON configuracoes_cartas_sistema
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

ALTER TABLE configuracoes_cartas_sistema ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Config cartas sistema — autenticados"
  ON configuracoes_cartas_sistema FOR ALL USING (auth.uid() IS NOT NULL);


-- ============================================================
--  6. FILA_CARGOS
--  Fila assíncrona de tarefas para entrega de cargos no Discord.
--  O bot consome esta fila e atribui os cargos via API Discord.
-- ============================================================
CREATE TABLE IF NOT EXISTS fila_cargos (
  id             uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_id     text        NOT NULL,
  acao           text        NOT NULL DEFAULT 'dar_cargo_membro'
                             CHECK (acao IN ('dar_cargo_membro','remover_cargo_membro')),
  status         text        NOT NULL DEFAULT 'pendente'
                             CHECK (status IN ('pendente','concluido','erro')),
  tentativas     integer     NOT NULL DEFAULT 0,
  erro_msg       text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  processado_em  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_fila_cargos_pendente
  ON fila_cargos(status) WHERE status = 'pendente';

-- Sem RLS — operado apenas pelo service role
