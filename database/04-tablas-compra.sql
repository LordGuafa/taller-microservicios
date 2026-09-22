-- ============================================================
-- 04-tablas-compra.sql
-- Tablas de compras y su detalle N:N para la base compra_db.
--
-- Ejecutar conectado a compra_db:
--   psql -U postgres -d compra_db -f 04-tablas-compra.sql
-- ============================================================

\c compra_db

-- ------------------------------------------------------------
-- 1. Encabezado de compra
--
-- cliente_id y producto_id se guardan como valores simples
-- (sin FK) porque las tablas referenciadas viven en otras bases
-- de datos (cliente_db y producto_db), y PostgreSQL no permite
-- crear claves foráneas entre bases distintas.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compras (
    id          BIGSERIAL      PRIMARY KEY,
    cliente_id  BIGINT         NOT NULL,
    producto_id BIGINT         NOT NULL,
    cantidad    INTEGER        NOT NULL DEFAULT 1,
    total       NUMERIC(12,2)  NOT NULL DEFAULT 0,
    fecha       TIMESTAMP      NOT NULL DEFAULT now(),

    CONSTRAINT chk_compra_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_compra_total_no_negativo CHECK (total >= 0)
);

-- ------------------------------------------------------------
-- 2. Detalle de compra (relación N:N de productos por compra)
--
-- Aquí SÍ aplica clave foránea porque compra_id referencia a
-- compras(id), y ambas tablas están en la MISMA base de datos
-- (compra_db). Esto garantiza integridad referencial real.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compra_detalle (
    id              BIGSERIAL      PRIMARY KEY,
    compra_id       BIGINT         NOT NULL,
    producto_id     BIGINT         NOT NULL,  -- lógico (producto_db)
    cantidad        INTEGER        NOT NULL,
    precio_unitario NUMERIC(10,2)  NOT NULL,

    -- FK real: misma base de datos
    CONSTRAINT fk_detalle_compra
        FOREIGN KEY (compra_id)
        REFERENCES compras (id)
        ON DELETE CASCADE,

    CONSTRAINT chk_detalle_cantidad_positiva CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_precio_positivo CHECK (precio_unitario > 0)
);

CREATE INDEX IF NOT EXISTS idx_compras_cliente ON compras (cliente_id);
CREATE INDEX IF NOT EXISTS idx_detalle_compra ON compra_detalle (compra_id);

-- Privilegios mínimos
GRANT SELECT, INSERT, UPDATE, DELETE ON compras TO compra_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON compra_detalle TO compra_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO compra_user;