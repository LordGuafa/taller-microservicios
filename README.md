# Taller de Microservicios

[![Node.js](https://img.shields.io/badge/Node.js-22.18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![Prisma](https://img.shields.io/badge/Prisma-8_RC-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com)

Proyecto educativo (taller) de arquitectura de microservicios para una tienda online, construido con **Node.js + Express**. Cada servicio es una API independiente con su propio puerto, y uno de ellos se comunica con los demás vía HTTP.

> ⚠️ **Nota de estado:** este repositorio **no** está basado en Java/Spring Boot. Si ves referencias antiguas a `pom.xml`, H2 o puertos `8080` en la historia de git, ignorarlas: corresponden a una primera versión descartada del proyecto.

## Índice

- [Arquitectura](#arquitectura)
- [Servicios](#servicios)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Ejecución con Docker](#ejecución-con-docker)
- [Configuración de PostgreSQL](#configuración-de-postgresql)
- [Variables de entorno](#variables-de-entorno)
- [Endpoints por servicio](#endpoints-por-servicio)
- [Ejemplos con curl](#ejemplos-con-curl)
- [Sobre la persistencia](#sobre-la-persistencia)
- [Roadmap / Pendientes](#roadmap--pendientes)

## Arquitectura

```mermaid
flowchart LR
    subgraph cliente["cliente-api :3001"]
        C[Node + Express 5 + TypeScript + Prisma 8]
        CDB[(PostgreSQL<br/>cliente_db)]
        C --> CDB
    end

    subgraph producto["producto-api :3002"]
        P[Node + Express 5 + JavaScript]
      PD[(PostgreSQL<br/>producto_db)]
        P --> PD
    end

    subgraph compra["compra-api :3003"]
        CO[Node + Express 4 + JavaScript]
        CD[(PostgreSQL<br/>compra_db)]
        CO --> CD
    end

    compra -- "GET /clientes/:id" --> cliente
    compra -- "GET /productos/:id" --> producto
```

- **cliente-api** expone el CRUD de clientes y persiste en PostgreSQL (`cliente_db`, tabla `clientes`) usando **Prisma ORM 8**.
- **producto-api** expone el catálogo de productos y persiste en PostgreSQL (`producto_db`).
- **compra-api** registra compras: antes de crear una, valida vía HTTP que el cliente y el producto existan y que haya stock suficiente.

## Servicios

| Servicio | Lenguaje | Framework | Persistencia | Puerto | Estado de la persistencia |
|----------|----------|-----------|--------------|--------|---------------------------|
| `cliente/` | TypeScript (ESM) | Express 5 | PostgreSQL (`cliente_db`) | 3001 | **Persistente** (Prisma ORM 8) |
| `producto/` | JavaScript (CommonJS) | Express 5 | PostgreSQL (`producto_db`) | 3002 | **Persistente** (driver `pg`, sin ORM) |
| `compra-api/` | JavaScript (CommonJS) | Express 4 | PostgreSQL (`compra_db`) | 3003 | **Persistente** (driver `pg`, sin ORM) |

## Requisitos previos

- **Node.js 22.18+** para `cliente/`, porque Prisma 8 lo exige (lo declara su `engines`). `producto/` y `compra-api/` funcionan desde Node 18, pero usar 22.18+ en todo el proyecto es lo más simple.
- **pnpm** para instalar dependencias (se usa `pnpm-lock.yaml` en `cliente/` y `compra-api/`; `producto/` también incluye un `package-lock.json`, por lo que funciona con `npm` si se prefiere). `cliente/` exige **pnpm 11.20+** (`devEngines` en su `package.json`) y no funciona con npm.
- **PostgreSQL** en ejecución (obligatorio para `cliente`, `producto` y `compra-api`).

## Instalación y ejecución

Cada servicio debe instalarse y ejecutarse desde su propio directorio. Usa **tres terminales** (una por servicio).

### cliente (puerto 3001)

```bash
cd cliente
pnpm install
cp .env.example .env   # ajustar DATABASE_URL si hace falta
pnpm db:init           # firma la base de datos con el contrato de Prisma
pnpm dev               # arranca con tsx en modo watch
```

Scripts disponibles (`cliente/package.json`): `dev` (`tsx watch index.ts`), `start` (`tsx index.ts`), `typecheck` (`tsc --noEmit`), `contract:emit` (`prisma contract emit`), `db:init` (`prisma db init`). No hay paso de compilación. Detalles de Prisma en [`cliente/README.md`](cliente/README.md).

### producto (puerto 3002)

```bash
cd producto
pnpm install
cp .env.example .env  # ajustar credenciales de PostgreSQL si hace falta
pnpm dev               # nodemon
```

No requiere variables de entorno: el puerto por defecto es 3002 (aunque hay un `producto/.env.example` incompleto, ver abajo). Scripts disponibles (`producto/package.json`): `start` (`node src/server.js`), `dev` (`nodemon src/server.js`).

### compra-api (puerto 3003)

```bash
cd compra-api
pnpm install
cp .env.example .env   # mantener las URLs que apuntan a cliente-api y producto-api
pnpm dev               # nodemon
```

Scripts disponibles (`compra-api/package.json`): `start` (`node src/server.js`), `dev` (`nodemon src/server.js`).

**Orden recomendado:** primero `cliente` y `producto`, y luego `compra-api`, ya que este último consulta a los otros dos al crear compras.

## Ejecución con Docker

Todo el taller (PostgreSQL + los tres servicios) se levanta con el `docker-compose.yml` de la raíz:

```bash
docker compose up -d --build
docker compose ps   # cliente debe aparecer como "(healthy)"
```

- PostgreSQL queda publicado en el puerto **`5433`** del host, para no chocar con un PostgreSQL local. Los scripts de `database/` se ejecutan solos la primera vez que se crea el volumen.
- `cliente` ejecuta `prisma db init` al arrancar y tiene un healthcheck sobre `GET /health`. `compra-api` espera a que esté sano antes de iniciar.

Dockerfiles, configuración y comandos en [`DOCKER.md`](DOCKER.md).

## Configuración de PostgreSQL

Los scripts SQL están en [`database/`](database/README.md). El script `01-roles-y-bases.sql` puede ejecutarse con `psql` o un cliente PostgreSQL, enviando las sentencias `CREATE DATABASE` por separado; los scripts `02` a `05` **deben ejecutarse con `psql -f`**, porque usan meta-comandos que no funcionan en clientes gráficos como pgAdmin o DBeaver.

```bash
cd database

# 1. Roles y bases de datos (cliente_db, producto_db, compra_db)
psql -U postgres -f 01-roles-y-bases.sql

# 2. Tablas de cliente (dentro de cliente_db)
psql -U postgres -f 02-tablas-cliente.sql

# 3. Tablas de producto (dentro de producto_db)
psql -U postgres -f 03-tablas-producto.sql

# 4. Tablas de compra (dentro de compra_db, incluye compra_detalle N:N)
psql -U postgres -f 04-tablas-compra.sql

# 5. Datos de prueba (5 clientes, 5 productos, 5 compras)
psql -U postgres -f 05-datos-prueba.sql
```

Los scripts 03 y 04 crean las bases `producto_db` y `compra_db`; `producto-api` ya consume `producto_db`, mientras `compra_db` queda preparada para una futura migración.

## Variables de entorno

### cliente (`cliente/.env.example`)

| Variable       | Valor por defecto      | Descripción                      |
|----------------|------------------------|----------------------------------|
| `PORT`         | `3001`                 | Puerto del servicio              |
| `DATABASE_URL` | `postgresql://cliente_user:cliente_pass_123@localhost:5432/cliente_db` | Conexión a PostgreSQL para Prisma (obligatoria). Debe escribirse completa: `dotenv` no expande `${...}`. |

### producto (`producto/.env.example`)

| Variable       | Valor por defecto      | Descripción                      |
|----------------|------------------------|----------------------------------|
| `PORT`         | `3002`                 | Puerto del servicio              |
| `DB_HOST`      | `localhost`            | Host de PostgreSQL               |
| `DB_PORT`      | `5432`                 | Puerto de PostgreSQL             |
| `DB_NAME`      | `producto_db`          | Base de datos de productos       |
| `DB_USER`      | `producto_user`        | Usuario de BD con privilegios mínimos |
| `DB_PASSWORD`  | `producto_pass_123`    | Contraseña del usuario de BD     |

### compra-api (`compra-api/.env.example`)

| Variable              | Valor por defecto      | Descripción                     |
|-----------------------|------------------------|---------------------------------|
| `PORT`                | `3003`                 | Puerto del servicio             |
| `CLIENTE_API_URL`     | `http://localhost:3001`| URL base de cliente-api         |
| `PRODUCTO_API_URL`    | `http://localhost:3002`| URL base de producto-api        |
| `DB_HOST`             | `localhost`            | Host de PostgreSQL              |
| `DB_PORT`             | `5432`                 | Puerto de PostgreSQL            |
| `DB_NAME`             | `compra_db`            | Base de datos de compras        |
| `DB_USER`             | `compra_user`          | Usuario de BD con privilegios mínimos |
| `DB_PASSWORD`         | `compra_pass_123`      | Contraseña del usuario de BD    |

## Endpoints por servicio

### cliente-api — `http://localhost:3001`

| Método | Path          | Body                                | Respuestas |
|--------|---------------|-------------------------------------|------------|
| GET    | `/health`     | —                                   | `200` `{ "status": "ok" }` |
| GET    | `/clientes`   | —                                   | `200` lista de clientes |
| GET    | `/clientes/:id` | —                                 | `200` cliente, `400` id inválido, `404` no encontrado |
| POST   | `/clientes`   | `{ "nombre": string, "email": string }` | `201` cliente creado, `400` datos inválidos, `409` email duplicado |
| PUT    | `/clientes/:id` | `{ "nombre"?: string, "email"?: string }` (al menos uno) | `200` actualizado, `400` datos inválidos, `404` no encontrado, `409` email duplicado |
| DELETE | `/clientes/:id` | —                                 | `204` eliminado, `400` id inválido, `404` no encontrado |

El `id` de los clientes se devuelve como texto (`"id": "1"`) porque la columna es `BIGSERIAL`. Un error inesperado responde `500`. Validaciones y mensajes en [`cliente/README.md`](cliente/README.md#validaciones-y-errores).

### producto-api — `http://localhost:3002`

| Método | Path          | Body                                          | Respuestas |
|--------|---------------|-----------------------------------------------|------------|
| GET    | `/productos`  | —                                             | `200` lista de productos |
| GET    | `/productos/:id` | —                                           | `200` producto, `404` no encontrado |
| POST   | `/productos`  | `{ "nombre": string, "precio": number, "stock": number }` | `201` producto creado, `400` faltan campos |

### compra-api — `http://localhost:3003`

| Método | Path        | Body                                             | Respuestas |
|--------|-------------|--------------------------------------------------|------------|
| GET    | `/compras`  | —                                                | `200` lista de compras |
| GET    | `/compras/:id` | —                                              | `200` compra, `404` no encontrada |
| POST   | `/compras`  | `{ "clienteId": number, "productoId": number, "cantidad": number }` | `201` compra creada, `400` faltan campos o stock insuficiente, `404` cliente/producto no existe, `503` servicio dependiente caído |

## Ejemplos con curl

```bash
# Listar y crear clientes (cliente-api :3001)
curl http://localhost:3001/clientes
curl -X POST http://localhost:3001/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Perez", "email": "juan@correo.com"}'

# Listar y crear productos (producto-api :3002)
curl http://localhost:3002/productos
curl -X POST http://localhost:3002/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Mouse Logitech", "precio": 25.0, "stock": 50}'

# Crear una compra: valida cliente en :3001 y producto/stock en :3002 (compra-api :3003)
curl -X POST http://localhost:3003/compras \
  -H "Content-Type: application/json" \
  -d '{"clienteId": 1, "productoId": 1, "cantidad": 2}'

# Consultar compras
curl http://localhost:3003/compras
```

> **Prueba del flujo completo:** `POST /compras` depende de que `cliente-api` y `producto-api` estén corriendo. Si no hay clientes o productos creados aún, crea primero un cliente (`:3001`) y un producto (`:3002`), y usa los `id` devueltos al crear la compra. Si los servicios están caídos, la respuesta será `503`.

## Sobre la persistencia

- Los tres microservicios persisten en **PostgreSQL**, cada uno en su propia base, siguiendo el patrón *Database per Service*.
- **`producto/`** y **`compra-api/`** lo hacen **sin ORM**: usan el driver `pg` con consultas SQL crudas y parametrizadas (`$1`, `$2`). La **ausencia de ORM es intencional** como requisito del taller: el objetivo es evidenciar los riesgos y costos del SQL hardcodeado en un proyecto real (mantenibilidad, falta de migraciones automáticas, posibilidad de inyección SQL si se eliminan los parámetros, acoplamiento al esquema concreto de la base). **No es una recomendación de buena práctica** para producción.
- **`cliente/`** empezó igual, pero se migró a **Prisma ORM 8** (versión preliminar) como contraste: las consultas se escriben con el ORM (`db.orm.public.Cliente`) y los tipos de TypeScript se generan desde un contrato (`cliente/prisma/contract.prisma`). La tabla `clientes` sigue siendo la que crea `database/02-tablas-cliente.sql`: Prisma la lee y escribe, pero no modifica su estructura.
- **`compra-api/`** persiste tanto en el encabezado `compras` como en su tabla de detalle `compra_detalle` mediante transacciones (`BEGIN` / `COMMIT`).

## Roadmap / Pendientes

- [x] Migrar `producto/` de datos en memoria a una base de datos persistente.
- [x] Migrar `compra-api/` a persistencia (`compra_db` ya está contemplada en `database/`, con la tabla de rompimiento `compra_detalle`).
- [x] Completar `producto/.env.example`.
- [x] Migrar `cliente/` a Prisma ORM 8 y agregar `PUT`, `DELETE` y `/health`.
- [x] Dockerizar los tres servicios con un `docker-compose.yml` único.
- [ ] Declarar el campo `engines` en los `package.json` para fijar la versión mínima de Node.

---

Proyecto con fines educativos (taller) sobre arquitectura de microservicios.