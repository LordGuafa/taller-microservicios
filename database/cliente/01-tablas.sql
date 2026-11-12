-- ============================================================
-- 01-tablas.sql
-- Esquema de la base cliente_db (contenedor postgres-cliente).
--
-- Este script se ejecuta automáticamente dentro del contenedor
-- PostgreSQL del microservicio cliente, sobre la base definida
-- por POSTGRES_DB (cliente_db). No crea roles ni bases de datos:
-- eso lo hace la imagen oficial de PostgreSQL al inicializarse.
--
-- Ejecución manual (servidor PostgreSQL propio):
--   psql -U cliente_user -d cliente_db -f 01-tablas.sql
-- ============================================================

\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS clientes (
    id          BIGSERIAL     PRIMARY KEY,
    nombre      VARCHAR(100)  NOT NULL,
    email       VARCHAR(255)  NOT NULL,
    created_at  TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP     NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_email ON clientes (email);
CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes (nombre);

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
