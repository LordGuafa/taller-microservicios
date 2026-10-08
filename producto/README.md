# producto-api

Servicio de catálogo de productos en el taller de microservicios. Expone consulta y creación de productos con persistencia en PostgreSQL.

**Stack:** JavaScript (CommonJS) · Express 5 · Prisma ORM 8 · PostgreSQL · Puerto `3002`

## Endpoints

| Método | Path          | Body                                          | Respuestas |
|--------|---------------|-----------------------------------------------|------------|
| GET    | `/productos`  | —                                             | `200` lista de productos |
| GET    | `/productos/:id` | —                                           | `200` producto, `404` no encontrado |
| POST   | `/productos`  | `{ "nombre": string, "precio": number, "stock": number }` | `201` creado, `400` faltan campos |
| PUT    | `/productos/:id` | `{ "nombre": string, "precio": number, "stock": number }` | `200` actualizado, `400` faltan campos, `404` no encontrado |
| DELETE | `/productos/:id` | — | `200` eliminado, `404` no encontrado |

## Requisitos

- Node.js 22.18 o superior (Prisma 8 lo exige).
- pnpm 11.20 o superior (es el gestor usado por el lockfile y Docker).
- PostgreSQL en ejecución con la base `producto_db` configurada mediante los scripts de [`database/`](../database/README.md).

## Variables de entorno

[`producto/.env.example`](../producto/.env.example) contiene el puerto y las credenciales de conexión a `producto_db`. Cópialo como `.env` y ajusta los valores si es necesario.

Prisma usa una única variable `DATABASE_URL`, con el formato
`postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/BASE`.

## Ejecutar en local

```bash
cd producto
pnpm install
cp .env.example .env
pnpm db:init
pnpm dev
```

Si pnpm informa `ERR_PNPM_IGNORED_BUILDS`, este proyecto ya declara los paquetes
que pueden ejecutar su build en `pnpm-workspace.yaml`. Ejecuta nuevamente
`pnpm install`; no es necesario aprobarlos manualmente.

Para usar la configuración incluida en [`docker-compose.yml`](../docker-compose.yml),
inicia Docker Desktop y luego, desde la raíz del repositorio:

```bash
docker compose up -d postgres
```

El contenedor publica PostgreSQL en `localhost:5433`. Cuando esté saludable,
vuelve a `producto` y ejecuta `pnpm db:init` y `pnpm dev`.

Scripts disponibles:

| Script    | Comando                  | Descripción          |
|-----------|--------------------------|----------------------|
| `dev`     | `nodemon src/server.js`  | Desarrollo con watch |
| `start`   | `node src/server.js`     | Ejecución directa    |
| `contract:emit` | `prisma contract emit` | Regenera el contrato desde `prisma/contract.prisma` |
| `db:init` | `prisma db init` | Verifica y firma la base según el contrato |

## Ejemplos de curl

```bash
# Listar productos
curl http://localhost:3002/productos

# Obtener producto por id
curl http://localhost:3002/productos/1

# Crear producto
curl -X POST http://localhost:3002/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Mouse Logitech", "precio": 25.0, "stock": 50}'

# Crear producto sin stock → 400
curl -X POST http://localhost:3002/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Mouse"}'

# Actualizar un producto
curl -X PUT http://localhost:3002/productos/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Mouse Logitech MX", "precio": 35.0, "stock": 25}'

# Eliminar un producto
curl -X DELETE http://localhost:3002/productos/1
```

## Persistencia con Prisma

El modelo [`prisma/contract.prisma`](prisma/contract.prisma) describe la tabla existente `productos`; no reemplaza los scripts SQL de [`database/03-tablas-producto.sql`](../database/03-tablas-producto.sql).

- `@@map("productos")` conecta el modelo `Producto` con la tabla SQL.
- `@map("created_at")` y `@map("updated_at")` traducen los nombres snake_case a camelCase.
- `contract.json` y `contract.d.ts` son archivos generados por `pnpm contract:emit`.
- [`src/models/productos.js`](src/models/productos.js) concentra las operaciones ORM (`all`, `where().first`, `create`, `update` y `delete`); las rutas se encargan únicamente de HTTP.
- PostgreSQL sigue aplicando las restricciones y el trigger `updated_at`.

Prisma devuelve `BIGINT` como `bigint` y `NUMERIC` como un valor numérico compatible con el runtime. Antes de responder, la ruta convierte `id` y `precio` a `Number` para conservar el formato que ya consume `compra-api`.

- El servidor verifica la conexión a PostgreSQL antes de comenzar a escuchar en el puerto HTTP.
