-- ============================================================
-- 01-roles-y-bases.sql
-- Crea los roles y las bases de datos para los tres
-- microservicios (cliente, producto, compra) siguiendo el
-- principio de MENOR PRIVILEGIO: cada usuario solo puede
-- conectar y operar dentro de SU propia base de datos.
--
-- Ejecutar como superusuario:
--   psql -U postgres -f 01-roles-y-bases.sql
-- Para usar otras contraseñas:
--   psql -U postgres -v cliente_password=mi_clave -f 01-roles-y-bases.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Roles de acceso por microservicio
--
-- Si no se pasan con -v se usan estas contraseñas por defecto.
-- ------------------------------------------------------------
\if :{?cliente_password}
\else
  \set cliente_password 'cliente_pass_123'
\endif
\if :{?producto_password}
\else
  \set producto_password 'producto_pass_123'
\endif
\if :{?compra_password}
\else
  \set compra_password 'compra_pass_123'
\endif

CREATE ROLE cliente_user  LOGIN PASSWORD :'cliente_password';
CREATE ROLE producto_user LOGIN PASSWORD :'producto_password';
CREATE ROLE compra_user   LOGIN PASSWORD :'compra_password';

-- ------------------------------------------------------------
-- 2. Bases de datos por microservicio
-- ------------------------------------------------------------
CREATE DATABASE cliente_db;
CREATE DATABASE producto_db;
CREATE DATABASE compra_db;

-- ------------------------------------------------------------
-- 3. Privilegios mínimos a nivel de base de datos
--
-- Por defecto PostgreSQL otorga CONNECT a PUBLIC en toda base
-- nueva; lo revocamos para que SOLO el usuario de cada servicio
-- pueda conectar a su propia base.
-- ------------------------------------------------------------
REVOKE CONNECT ON DATABASE cliente_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE producto_db FROM PUBLIC;
REVOKE CONNECT ON DATABASE compra_db FROM PUBLIC;

GRANT CONNECT ON DATABASE cliente_db TO cliente_user;
GRANT CONNECT ON DATABASE producto_db TO producto_user;
GRANT CONNECT ON DATABASE compra_db TO compra_user;

-- ------------------------------------------------------------
-- 4. Privilegios dentro de cada base de datos
--
-- El usuario necesita USAGE y CREATE sobre el esquema public
-- para poder crear sus tablas y operar sobre ellas. Las tablas
-- concretas (SELECT/INSERT/UPDATE/DELETE) se otorgan en los
-- scripts 02/03/04.
-- ------------------------------------------------------------
\c cliente_db
GRANT USAGE, CREATE ON SCHEMA public TO cliente_user;

\c producto_db
GRANT USAGE, CREATE ON SCHEMA public TO producto_user;

\c compra_db
GRANT USAGE, CREATE ON SCHEMA public TO compra_user;