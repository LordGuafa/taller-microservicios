-- ============================================================
-- 02-datos-prueba.sql
-- Datos de prueba para producto_db (contenedor postgres-producto).
--
-- Se ejecuta automáticamente después de 01-tablas.sql en el
-- mismo contenedor y sobre la misma base de datos.
-- ============================================================

\set ON_ERROR_STOP on

INSERT INTO productos (nombre, precio, stock) VALUES
    ('Laptop',       1500.00, 10),
    ('Mouse',          25.50, 50),
    ('Teclado',        45.00, 40),
    ('Monitor',       300.00, 15),
    ('Auriculares',    60.00, 30)
ON CONFLICT DO NOTHING;
