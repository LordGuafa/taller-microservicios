-- ============================================================
-- 05-datos-prueba.sql
-- Datos mínimos coherentes para las tres bases de datos.
--
-- Ejecutar como superusuario (con \c para cambiar de base):
--   psql -U postgres -f 05-datos-prueba.sql
-- ============================================================

-- ------------------------------------------------------------
-- CLIENTES (cliente_db) - 5 registros
-- ------------------------------------------------------------
\c cliente_db
\echo '>>> Insertando clientes en cliente_db...'

INSERT INTO clientes (nombre, email) VALUES
    ('Ana Torres',    'ana.torres@correo.com'),
    ('Bruno Silva',   'bruno.silva@correo.com'),
    ('Carla Mendez',  'carla.mendez@correo.com'),
    ('Diego Fernandez','diego.fernandez@correo.com'),
    ('Elena Ruiz',    'elena.ruiz@correo.com')
ON CONFLICT (email) DO NOTHING;

-- ------------------------------------------------------------
-- PRODUCTOS (producto_db) - 5 registros
-- ------------------------------------------------------------
\c producto_db
\echo '>>> Insertando productos en producto_db...'

INSERT INTO productos (nombre, precio, stock) VALUES
    ('Laptop',       1500.00, 10),
    ('Mouse',          25.50, 50),
    ('Teclado',        45.00, 40),
    ('Monitor',       300.00, 15),
    ('Auriculares',    60.00, 30)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- COMPRAS + DETALLE (compra_db) - 5 compras con su detalle
-- Cliente 1 (Ana) compra Laptop + Mouse
-- Cliente 2 (Bruno) compra Teclado
-- Cliente 3 (Carla) compra Monitor + Teclado
-- Cliente 4 (Diego) compra Laptop
-- Cliente 5 (Elena) compra Auriculares + Mouse
-- ------------------------------------------------------------
\c compra_db
\echo '>>> Insertando compras en compra_db...'

-- Compra 1: cliente 1 - Laptop (producto 1) + Mouse (producto 2)
INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
VALUES (1, 1, 1, 1525.50, now())
RETURNING id AS compra1_id \gset

INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
VALUES
    (:compra1_id, 1, 1, 1500.00),
    (:compra1_id, 2, 1,   25.50);

-- Compra 2: cliente 2 - Teclado (producto 3)
INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
VALUES (2, 3, 2, 90.00, now())
RETURNING id AS compra2_id \gset

INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
VALUES (:compra2_id, 3, 2, 45.00);

-- Compra 3: cliente 3 - Monitor (producto 4) + Teclado (producto 3)
INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
VALUES (3, 4, 1, 345.00, now())
RETURNING id AS compra3_id \gset

INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
VALUES
    (:compra3_id, 4, 1, 300.00),
    (:compra3_id, 3, 1,  45.00);

-- Compra 4: cliente 4 - Laptop (producto 1)
INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
VALUES (4, 1, 1, 1500.00, now())
RETURNING id AS compra4_id \gset

INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
VALUES (:compra4_id, 1, 1, 1500.00);

-- Compra 5: cliente 5 - Auriculares (producto 5) + Mouse (producto 2)
INSERT INTO compras (cliente_id, producto_id, cantidad, total, fecha)
VALUES (5, 5, 1, 85.50, now())
RETURNING id AS compra5_id \gset

INSERT INTO compra_detalle (compra_id, producto_id, cantidad, precio_unitario)
VALUES
    (:compra5_id, 5, 1, 60.00),
    (:compra5_id, 2, 1, 25.50);

\echo '>>> Datos de prueba insertados correctamente.'