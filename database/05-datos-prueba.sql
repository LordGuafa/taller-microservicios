-- ============================================================
-- 05-datos-prueba.sql
-- Datos mínimos coherentes para las tres bases de datos.
--
-- Ejecutar como superusuario conectado a cada base:
--   psql -U postgres -d cliente_db  -f 05-datos-prueba.sql
--   psql -U postgres -d producto_db -f 05-datos-prueba.sql
--   psql -U postgres -d compra_db   -f 05-datos-prueba.sql
--
-- En clientes gráficos (pgAdmin, DBeaver, DataGrip):
--   1. Conectarse manualmente a cada base de datos
--   2. Ejecutar solo la sección correspondiente
-- ============================================================

-- ------------------------------------------------------------
-- CLIENTES (cliente_db) - 5 registros
-- Ejecutar conectado a cliente_db
-- ------------------------------------------------------------
INSERT INTO clientes (nombre, email) VALUES
    ('Ana Torres',    'ana.torres@correo.com'),
    ('Bruno Silva',   'bruno.silva@correo.com'),
    ('Carla Mendez',  'carla.mendez@correo.com'),
    ('Diego Fernandez','diego.fernandez@correo.com'),
    ('Elena Ruiz',    'elena.ruiz@correo.com')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- PRODUCTOS (producto_db) - 5 registros
-- Ejecutar conectado a producto_db
-- ------------------------------------------------------------
INSERT INTO productos (nombre, precio, stock) VALUES
    ('Laptop',       1500.00, 10),
    ('Mouse',          25.50, 50),
    ('Teclado',        45.00, 40),
    ('Monitor',       300.00, 15),
    ('Auriculares',    60.00, 30)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- COMPRAS + DETALLE (compra_db) - 5 compras con su detalle
-- Ejecutar conectado a compra_db
--
-- Cliente 1 (Ana) compra Laptop + Mouse
-- Cliente 2 (Bruno) compra Teclado
-- Cliente 3 (Carla) compra Monitor + Teclado
-- Cliente 4 (Diego) compra Laptop
-- Cliente 5 (Elena) compra Auriculares + Mouse
-- ------------------------------------------------------------

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
