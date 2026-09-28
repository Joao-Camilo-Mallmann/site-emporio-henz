-- ==============================================================================
-- 002. ROLES (Perfis de Acesso do Sistema)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id SMALLINT PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Popula os perfis de acesso padrão do PRD: 1=Cliente, 2=Vendedor, 3=Admin
INSERT INTO roles (id, role)
VALUES 
    (1, 'Cliente'),
    (2, 'Vendedor'),
    (3, 'Admin')
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role;
