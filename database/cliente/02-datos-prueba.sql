-- ============================================================
-- 02-datos-prueba.sql
-- Datos de prueba para cliente_db (contenedor postgres-cliente).
--
-- Se ejecuta automáticamente después de 01-tablas.sql en el
-- mismo contenedor y sobre la misma base de datos.
-- ============================================================

\set ON_ERROR_STOP on

INSERT INTO clientes (nombre, email) VALUES
    ('Ana Torres',     'ana.torres@correo.com'),
    ('Bruno Silva',    'bruno.silva@correo.com'),
    ('Carla Mendez',   'carla.mendez@correo.com'),
    ('Diego Fernandez', 'diego.fernandez@correo.com'),
    ('Elena Ruiz',     'elena.ruiz@correo.com')
ON CONFLICT (email) DO NOTHING;
