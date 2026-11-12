-- ============================================================
-- 01-tablas.sql
-- Esquema de la base producto_db (contenedor postgres-producto).
--
-- Este script se ejecuta automáticamente dentro del contenedor
-- PostgreSQL del microservicio producto, sobre la base definida
-- por POSTGRES_DB (producto_db). No crea roles ni bases de datos:
-- eso lo hace la imagen oficial de PostgreSQL al inicializarse.
--
-- Ejecución manual (servidor PostgreSQL propio):
--   psql -U producto_user -d producto_db -f 01-tablas.sql
-- ============================================================

\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS productos (
    id          BIGSERIAL      PRIMARY KEY,
    nombre      VARCHAR(100)   NOT NULL,
    precio      NUMERIC(10,2)  NOT NULL,
    stock       INTEGER        NOT NULL DEFAULT 0,
    created_at  TIMESTAMP      NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP      NOT NULL DEFAULT now(),

    CONSTRAINT chk_precio_positivo CHECK (precio > 0),
    CONSTRAINT chk_stock_no_negativo CHECK (stock >= 0)
);

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre);

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
