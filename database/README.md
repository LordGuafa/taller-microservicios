# Scripts SQL - Taller de Microservicios

Orden de ejecución para levantar las tres bases de datos con PostgreSQL.

## Requisitos

- PostgreSQL instalado y en ejecución.
- Usuario `postgres` (superusuario) disponible.

## Orden de ejecución

> **Importante:** `01-roles-y-bases.sql` no contiene meta-comandos de psql y puede ejecutarse con `psql -f` o con un cliente PostgreSQL, siempre que las sentencias `CREATE DATABASE` se envíen por separado y fuera de una transacción. Los scripts `02` a `05` usan el meta-comando de psql `\c` y **deben ejecutarse con `psql -f` desde una terminal**. No los pegues en pgAdmin, DBeaver o DataGrip, porque el cliente los enviaría al servidor y produciría `syntax error at or near "\"`.

```bash
cd database/

# 1. Crear roles y bases de datos (cliente_db, producto_db, compra_db)
psql -U postgres -f 01-roles-y-bases.sql

# 2. Crear tablas de cliente (dentro de cliente_db)
psql -U postgres -f 02-tablas-cliente.sql

# 3. Crear tablas de producto (dentro de producto_db)
psql -U postgres -f 03-tablas-producto.sql

# 4. Crear tablas de compra (dentro de compra_db, incluye compra_detalle N:N)
psql -U postgres -f 04-tablas-compra.sql

# 5. Insertar datos de prueba en las tres bases
psql -U postgres -f 05-datos-prueba.sql
```

Los scripts `02` a `05` usan `\c` para conectarse automáticamente a la base correcta, por lo que no es necesario cambiar de base manualmente.

## Contraseñas por defecto

| Usuario         | Contraseña          |
|-----------------|---------------------|
| `cliente_user`  | `cliente_pass_123`  |
| `producto_user` | `producto_pass_123` |
| `compra_user`   | `compra_pass_123`   |

Para usar contraseñas personalizadas, descomenta y ajusta las sentencias `SET` al inicio de `01-roles-y-bases.sql`. Deben ejecutarse en la misma sesión, antes del bloque `DO`, para que los valores se apliquen a los tres roles.

## Diseño de bases de datos

| Base de datos   | Usuario         | Tablas                    |
|-----------------|-----------------|---------------------------|
| `cliente_db`    | `cliente_user`  | `clientes`                |
| `producto_db`   | `producto_user` | `productos`               |
| `compra_db`     | `compra_user`   | `compras`, `compra_detalle` |

### Claves foráneas

- `compra_detalle.compra_id` → `compras.id`: **FK real** (misma base `compra_db`).
- `compras.cliente_id` y `compras.producto_id`: valores simples **sin FK**, porque las tablas referenciadas están en otras bases de datos (`cliente_db`, `producto_db`), y PostgreSQL no permite claves foráneas entre bases distintas.

### Privilegios (menor privilegio)

- Cada usuario solo puede conectar a su propia base de datos.
- `CREATE`/`USAGE` solo sobre su esquema.
- `SELECT`/`INSERT`/`UPDATE`/`DELETE` solo sobre sus propias tablas.

## Estado actual de los servicios

| Base de datos   | Servicio en el repo | Estado actual                                  |
|-----------------|---------------------|-------------------------------------------------|
| `cliente_db`    | `cliente/`          | **Migrado**: el servicio usa esta base con `pg` (sin ORM). |
| `producto_db`   | `producto/`         | **Migrado**: el servicio usa esta base con `pg` y consultas parametrizadas. |
| `compra_db`     | `compra-api/`       | **Migrado**: el servicio usa esta base con `pg`, transacciones y tablas `compras` y `compra_detalle`. |

Los scripts 03, 04 y 05 se crean/sembran igualmente para dejar toda la infraestructura preparada. Ver el [README principal](../README.md) y la sección *Roadmap / Pendientes*.