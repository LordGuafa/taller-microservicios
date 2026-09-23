# Scripts SQL - Taller de Microservicios

Orden de ejecución para levantar las tres bases de datos con PostgreSQL.

## Requisitos

- PostgreSQL instalado y en ejecución.
- Usuario `postgres` (superusuario) disponible.

## Orden de ejecución

> **Importante:** estos scripts usan meta-comandos de psql (`\c`, `\set`, `\if`, `\gset`). Por eso **deben ejecutarse con `psql -f` desde una terminal**. No funcionarán si los pegas y ejecutas en un cliente gráfico como pgAdmin, DBeaver o DataGrip, que los enviaría al servidor como SQL y produciría `syntax error at or near "\"`.

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

Cada script usa `\c` para conectarse automáticamente a la base correcta, por lo que no es necesario cambiar de base manualmente.

## Contraseñas por defecto

| Usuario         | Contraseña          |
|-----------------|---------------------|
| `cliente_user`  | `cliente_pass_123`  |
| `producto_user` | `producto_pass_123` |
| `compra_user`   | `compra_pass_123`   |

Para usar contraseñas personalizadas al ejecutar el paso 1:

```bash
psql -U postgres \
  -v cliente_password=clave1 \
  -v producto_password=clave2 \
  -v compra_password=clave3 \
  -f 01-roles-y-bases.sql
```

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
| `compra_db`     | `compra-api/`       | Infraestructura lista, pero el servicio aún guarda compras **en memoria**. |

Los scripts 03, 04 y 05 se crean/sembran igualmente para dejar toda la infraestructura preparada. Ver el [README principal](../README.md) y la sección *Roadmap / Pendientes*.