-- ============================================================
-- 03-tablas-producto.sql
-- Tabla de productos para la base producto_db.
--
-- Ejecutar conectado a producto_db:
--   psql -U postgres -d producto_db -f 03-tablas-producto.sql
-- ============================================================

\c producto_db

-- Tabla principal
CREATE TABLE IF NOT EXISTS productos (
    id          BIGSERIAL      PRIMARY KEY,
    nombre      VARCHAR(100)   NOT NULL,
    precio      NUMERIC(10,2)  NOT NULL,
    stock       INTEGER        NOT NULL DEFAULT 0,
    created_at  TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT now(),

    -- Restricciones de integridad a nivel de base de datos
    CONSTRAINT chk_precio_positivo CHECK (precio > 0),
    CONSTRAINT chk_stock_no_negativo CHECK (stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre);

-- Función y trigger para mantener updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Privilegios mínimos
GRANT SELECT, INSERT, UPDATE, DELETE ON productos TO producto_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO producto_user;