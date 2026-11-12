# Scripts SQL - Taller de Microservicios

Scripts separados por microservicio. Cada servicio tiene **su propio contenedor PostgreSQL**, su propia base de datos, su propio usuario y su propio volumen; no existe una instancia compartida.

## Estructura

```
database/
├── cliente/
│   ├── 01-tablas.sql          # tabla clientes
│   └── 02-datos-prueba.sql    # 5 clientes de ejemplo
├── producto/
│   ├── 01-tablas.sql          # tabla productos
│   └── 02-datos-prueba.sql    # 5 productos de ejemplo
├── compra/
│   ├── 01-tablas.sql          # tablas compras y compra_detalle
│   └── 02-datos-prueba.sql    # 5 compras con su detalle
└── README.md
```

| Microservicio | Contenedor PostgreSQL | Base de datos | Usuario | Puerto en el host |
|---------------|-----------------------|---------------|---------|-------------------|
| `cliente/` | `postgres-cliente` | `cliente_db` | `cliente_user` | `5433` |
| `producto/` | `postgres-producto` | `producto_db` | `producto_user` | `5434` |
| `compra-api/` | `postgres-compra` | `compra_db` | `compra_user` | `5435` |

## Ejecución automática con Docker

No hay que ejecutar nada a mano. Al levantar `docker compose`, la imagen oficial de PostgreSQL:

1. Crea la base y el usuario indicados en `POSTGRES_DB`, `POSTGRES_USER` y `POSTGRES_PASSWORD`.
2. Ejecuta en orden alfabético los scripts montados en `/docker-entrypoint-initdb.d`:
   - `01-tablas.sql`
   - `02-datos-prueba.sql`

Cada carpeta se monta **solo** en su contenedor:

```yaml
postgres-cliente:
  volumes:
    - pgdata-cliente:/var/lib/postgresql/data
    - ./database/cliente:/docker-entrypoint-initdb.d:ro

postgres-producto:
  volumes:
    - pgdata-producto:/var/lib/postgresql/data
    - ./database/producto:/docker-entrypoint-initdb.d:ro

postgres-compra:
  volumes:
    - pgdata-compra:/var/lib/postgresql/data
    - ./database/compra:/docker-entrypoint-initdb.d:ro
```

Como cada script se ejecuta dentro de su propio contenedor, ya **no usan `\c`** ni crean roles o bases de datos: el contenedor ya está conectado a la base correcta.

```bash
# Desde la raíz del repositorio
docker compose up -d --build

# Ver el estado de las tres bases
docker compose ps

# Re-ejecutar los scripts desde cero (borra los tres volúmenes)
docker compose down -v
docker compose up -d
```

## Ejecución manual (sin Docker)

Si usas un PostgreSQL local, crea cada base y usuario por separado y luego ejecuta los scripts de su carpeta. Ejemplo completo para `cliente_db`:

```bash
psql -U postgres -c "CREATE ROLE cliente_user LOGIN PASSWORD 'cliente_pass_123';"
psql -U postgres -c "CREATE DATABASE cliente_db OWNER cliente_user;"
psql -U cliente_user -d cliente_db -f database/cliente/01-tablas.sql
psql -U cliente_user -d cliente_db -f database/cliente/02-datos-prueba.sql
```

Repite el mismo patrón para producto y compra:

```bash
psql -U postgres -c "CREATE ROLE producto_user LOGIN PASSWORD 'producto_pass_123';"
psql -U postgres -c "CREATE DATABASE producto_db OWNER producto_user;"
psql -U producto_user -d producto_db -f database/producto/01-tablas.sql
psql -U producto_user -d producto_db -f database/producto/02-datos-prueba.sql

psql -U postgres -c "CREATE ROLE compra_user LOGIN PASSWORD 'compra_pass_123';"
psql -U postgres -c "CREATE DATABASE compra_db OWNER compra_user;"
psql -U compra_user -d compra_db -f database/compra/01-tablas.sql
psql -U compra_user -d compra_db -f database/compra/02-datos-prueba.sql
```

Los scripts se pueden ejecutar tanto con `psql -f` como pegando su contenido en pgAdmin, DBeaver o DataGrip, porque ya no contienen meta-comandos `\c`.

## Diseño de bases de datos

| Base de datos | Tablas | Notas |
|---------------|--------|-------|
| `cliente_db` | `clientes` | Prisma crea además el esquema `prisma_contract` al arrancar el servicio. |
| `producto_db` | `productos` | Acceso mediante Prisma/pg desde `producto/`. |
| `compra_db` | `compras`, `compra_detalle` | Acceso mediante Sequelize desde `compra-api/`. |

### Claves foráneas

- `compra_detalle.compra_id` → `compras.id`: **FK real**, porque ambas tablas viven en `compra_db`.
- `compras.cliente_id` y `compras.producto_id`: valores simples **sin FK**, porque las tablas referenciadas viven en **otras bases de datos** (`cliente_db` y `producto_db`). PostgreSQL no permite claves foráneas entre bases distintas; `compra-api` valida la existencia vía HTTP.

## Contraseñas por defecto

| Usuario | Contraseña |
|---------|------------|
| `cliente_user` | `cliente_pass_123` |
| `producto_user` | `producto_pass_123` |
| `compra_user` | `compra_pass_123` |

Se definen en `docker-compose.yml` como `POSTGRES_*` de cada contenedor. Para cambiarlas, edita el `environment` del servicio PostgreSQL correspondiente y reconstruye el volumen (`docker compose down -v`).
