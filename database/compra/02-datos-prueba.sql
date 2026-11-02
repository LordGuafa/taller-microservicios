-- ============================================================
-- 02-datos-prueba.sql
-- Datos de prueba para compra_db (contenedor postgres-compra).
--
-- Se ejecuta automáticamente después de 01-tablas.sql en el
-- mismo contenedor y sobre la misma base de datos.
-- ============================================================

\set ON_ERROR_STOP on

-- Compra 1: cliente 1 - Laptop (producto 1) + Mouse (producto 2)
WITH nueva_compra AS (
    INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
    VALUES (1, 1, 1, 1525.50, now())
    RETURNING id
)
INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
SELECT id, 1, 1, 1500.00 FROM nueva_compra
UNION ALL
SELECT id, 2, 1, 25.50 FROM nueva_compra;

-- Compra 2: cliente 2 - Teclado (producto 3)
WITH nueva_compra AS (
    INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
    VALUES (2, 3, 2, 90.00, now())
    RETURNING id
)
INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
SELECT id, 3, 2, 45.00 FROM nueva_compra;

-- Compra 3: cliente 3 - Monitor (producto 4) + Teclado (producto 3)
WITH nueva_compra AS (
    INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
    VALUES (3, 4, 1, 345.00, now())
    RETURNING id
)
INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
SELECT id, 4, 1, 300.00 FROM nueva_compra
UNION ALL
SELECT id, 3, 1, 45.00 FROM nueva_compra;

-- Compra 4: cliente 4 - Laptop (producto 1)
WITH nueva_compra AS (
    INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
    VALUES (4, 1, 1, 1500.00, now())
    RETURNING id
)
INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
SELECT id, 1, 1, 1500.00 FROM nueva_compra;

-- Compra 5: cliente 5 - Auriculares (producto 5) + Mouse (producto 2)
WITH nueva_compra AS (
    INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
    VALUES (5, 5, 1, 85.50, now())
    RETURNING id
)
INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
SELECT id, 5, 1, 60.00 FROM nueva_compra
UNION ALL
SELECT id, 2, 1, 25.50 FROM nueva_compra;
