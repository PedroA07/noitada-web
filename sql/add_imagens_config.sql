-- Migração: adiciona imagens_config jsonb para posição por imagem
-- Rode este SQL no Supabase Studio > SQL Editor

ALTER TABLE cartas
  ADD COLUMN IF NOT EXISTS imagens_config jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cartas.imagens_config IS
  'Array de objetos {offset_x, offset_y, zoom} paralelo ao array imagens[]. Ex: [{"offset_x":50,"offset_y":30,"zoom":120}]';
