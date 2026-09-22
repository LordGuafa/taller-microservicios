-- ============================================================
-- 02-tablas-cliente.sql
-- Tabla de clientes para la base cliente_db.
--
-- Ejecutar conectado a cliente_db:
--   psql -U postgres -d cliente_db -f 02-tablas-cliente.sql
-- ============================================================

-- Conexión segura a la base correcta (psql meta-ídem)
\c cliente_db

-- Tabla principal
CREATE TABLE IF NOT EXISTS clientes (
    id          BIGSERIAL     PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT now()
);

-- Restricción única sobre el email (ya creada por la cláusula
-- UNIQUE, se refuerza con índice explícito para búsqueda por nombre)
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email ON clientes (email);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);

-- Función y trigger para mantener updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clientes_updated_at ON clientes;
CREATE TRIGGER trg_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Privilegios mínimos: el usuario solo puede leer/escribir sus
-- tablas, nunca modificar la estructura del esquema
GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO cliente_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO cliente_user;