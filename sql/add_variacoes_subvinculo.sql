-- Migração: adiciona sub_vinculo, carta_principal_id e variacao_ordem à tabela cartas
-- Rode este SQL no Supabase Studio > SQL Editor

ALTER TABLE cartas
  ADD COLUMN IF NOT EXISTS sub_vinculo        text,
  ADD COLUMN IF NOT EXISTS carta_principal_id uuid REFERENCES cartas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS variacao_ordem     integer NOT NULL DEFAULT 0;

-- Índice para buscar variações de uma carta principal rapidamente
CREATE INDEX IF NOT EXISTS idx_cartas_principal_id ON cartas(carta_principal_id) WHERE carta_principal_id IS NOT NULL;
