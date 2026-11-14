-- ==============================================================================
-- 014. LISTS (Listas e Pastas de Produtos do Cliente)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    list_type VARCHAR(20) NOT NULL DEFAULT 'CUSTOM',
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    share_slug UUID NOT NULL DEFAULT gen_random_uuid(),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    CONSTRAINT chk_lists_list_type
        CHECK (list_type IN ('FAVORITES', 'WISHLIST', 'GIFT_LIST', 'CUSTOM')),
    -- Lista padrão nunca é CUSTOM, e pasta personalizada nunca é padrão
    CONSTRAINT chk_lists_system_type
        CHECK (
            (is_system AND list_type <> 'CUSTOM')
            OR (NOT is_system AND list_type = 'CUSTOM')
        )
);

-- Link público: o UUID é único entre as listas ativas (RNF08: soft delete
-- não pode bloquear novos registros)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_share_slug_active
    ON lists (share_slug)
    WHERE deleted_at IS NULL;

-- Cada cliente tem no máximo uma lista padrão de cada tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_lists_client_system_type_active
    ON lists (client_id, list_type)
    WHERE is_system AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lists_client_active
    ON lists (client_id)
    WHERE deleted_at IS NULL;
