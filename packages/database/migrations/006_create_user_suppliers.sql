-- ==============================================================================
-- 006. USER_SUPPLIERS (Vínculo N:N entre Vendedores e Fornecedores)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS user_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Garante que um vendedor só tenha 1 vínculo ativo com uma mesma empresa/fornecedor
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_suppliers_unique_active 
ON user_suppliers (user_id, supplier_id) 
WHERE deleted_at IS NULL;

-- Índices para busca rápida por vendedor ou por fornecedor
CREATE INDEX IF NOT EXISTS idx_user_suppliers_user_active 
ON user_suppliers (user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_user_suppliers_supplier_active 
ON user_suppliers (supplier_id) 
WHERE deleted_at IS NULL;
