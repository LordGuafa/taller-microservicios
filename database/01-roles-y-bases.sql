-- ============================================================
-- 01-roles-y-bases.sql
-- Crea los roles y las bases de datos para los tres
-- microservicios (cliente, producto, compra) siguiendo el
-- principio de MENOR PRIVILEGIO: cada usuario solo puede
-- conectar y operar dentro de SU propia base de datos.
--
-- IMPORTANTE: Este script debe ejecutarse con psql -f desde
-- una terminal. No funciona en clientes gráficos (pgAdmin,
-- DBeaver, DataGrip) porque las sentencias CREATE DATABASE
-- no pueden ejecutarse dentro de una transacción.
--
-- Para cambiar las contraseñas, descomenta y ajusta los SET
-- inmediatamente antes del bloque que crea los roles.
-- ============================================================

-- SET cliente_password  = 'mi_cliente_clave';
-- SET producto_password = 'mi_producto_clave';
-- SET compra_password   = 'mi_compra_clave';

-- ------------------------------------------------------------
-- 1. Roles de acceso por microservicio
--
-- Se usa un bloque DO para evitar los meta-comandos \if y \set,
-- que algunos clientes envían por error al servidor SQL.
-- ------------------------------------------------------------
DO $roles$
DECLARE
    v_cliente_password  text := COALESCE(
        NULLIF(current_setting('cliente_password', true), ''),
        'cliente_pass_123'
    );
    v_producto_password text := COALESCE(
        NULLIF(current_setting('producto_password', true), ''),
        'producto_pass_123'
    );
    v_compra_password   text := COALESCE(
        NULLIF(current_setting('compra_password', true), ''),
        'compra_pass_123'
    );
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cliente_user') THEN
        EXECUTE 'CREATE ROLE cliente_user NOLOGIN';
    END IF;
    EXECUTE format(
        'ALTER ROLE cliente_user WITH LOGIN PASSWORD %L',
        v_cliente_password
    );

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'producto_user') THEN
        EXECUTE 'CREATE ROLE producto_user NOLOGIN';
    END IF;
    EXECUTE format(
        'ALTER ROLE producto_user WITH LOGIN PASSWORD %L',
        v_producto_password
    );

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'compra_user') THEN
        EXECUTE 'CREATE ROLE compra_user NOLOGIN';
    END IF;
    EXECUTE format(
        'ALTER ROLE compra_user WITH LOGIN PASSWORD %L',
        v_compra_password
    );
END
$roles$;

-- ------------------------------------------------------------
-- 2. Bases de datos por microservicio
--
-- Cada usuario es propietario de su base. Así, no es necesario
-- cambiar de conexión para conceder permisos sobre el esquema public.
--
-- NOTA: Estas sentencias deben ejecutarse FUERA de una transacción.
-- ------------------------------------------------------------
CREATE DATABASE cliente_db  OWNER cliente_user;
CREATE DATABASE producto_db OWNER producto_user;
CREATE DATABASE compra_db   OWNER compra_user;

-- ------------------------------------------------------------
-- 3. Privilegios mínimos a nivel de base de datos
--
-- Por defecto PostgreSQL otorga CONNECT a PUBLIC en toda base
-- nueva; lo revocamos para que SOLO el usuario de cada servicio
-- pueda conectar a su propia base.
-- ------------------------------------------------------------
REVOKE CONNECT ON DATABASE cliente_db  FROM PUBLIC;
REVOKE CONNECT ON DATABASE producto_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE compra_db   FROM PUBLIC;

GRANT CONNECT ON DATABASE cliente_db  TO cliente_user;
GRANT CONNECT ON DATABASE producto_db TO producto_user;
GRANT CONNECT ON DATABASE compra_db   TO compra_user;
