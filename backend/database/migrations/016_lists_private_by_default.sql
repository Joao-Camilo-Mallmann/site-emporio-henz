-- ==============================================================================
-- 016. Listas privadas por padrão: o link público só funciona depois que o
-- dono escolhe compartilhar (PATCH /listas/:id/compartilhamento)
-- ==============================================================================

ALTER TABLE lists ALTER COLUMN is_public SET DEFAULT FALSE;

UPDATE lists SET is_public = FALSE WHERE is_public;
