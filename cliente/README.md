# cliente-api

Servicio de gestión de clientes en el taller de microservicios. Expone el CRUD de clientes y persiste en **PostgreSQL** usando **Prisma ORM 8** sobre la tabla `clientes` creada por los scripts de [`database/`](../database/README.md).

**Stack:** TypeScript · Express 5 · Prisma 8 (release candidate) · PostgreSQL · pnpm · Puerto `3001`

> La primera versión de este servicio usaba el driver `pg` con SQL crudo, sin ORM. Ahora el acceso a datos pasa por Prisma, pero la tabla y sus datos son los mismos.

## Estructura

```
cliente/
├── index.ts                       # punto de entrada: levanta el servidor y cierra ordenadamente
├── prisma.config.ts               # configuración del CLI de Prisma (contrato y conexión)
├── prisma/
│   ├── contract.prisma            # modelo de datos (fuente: se edita a mano)
│   ├── contract.json              # generado por `pnpm contract:emit`, no editar
│   └── contract.d.ts              # generado por `pnpm contract:emit`, no editar
├── migrations/                    # estado de Prisma (referencias y snapshots del contrato)
├── src/
│   ├── app.ts                     # app de Express: rutas, /health, 404 y manejador de errores
│   ├── config/database.ts         # cliente de Prisma + polyfill de Temporal
│   ├── routes/clientes.routes.ts  # rutas /clientes
│   ├── controllers/clientes.controller.ts  # validación de entrada y respuestas HTTP
│   ├── models/clientes.ts         # consultas con el ORM de Prisma
│   └── middlewares/errorHandler.ts # traduce errores a códigos HTTP
├── Dockerfile
├── .env.example
└── tsconfig.json
```

## Endpoints

| Método | Path | Body | Respuestas |
|--------|------|------|------------|
| GET | `/health` | — | `200` `{ "status": "ok" }` |
| GET | `/clientes` | — | `200` lista de clientes |
| GET | `/clientes/:id` | — | `200` cliente, `400` id inválido, `404` no encontrado |
| POST | `/clientes` | `{ "nombre": string, "email": string }` | `201` creado, `400` datos inválidos, `409` email duplicado |
| PUT | `/clientes/:id` | `{ "nombre"?: string, "email"?: string }` (al menos uno) | `200` actualizado, `400` datos inválidos, `404` no encontrado, `409` email duplicado |
| DELETE | `/clientes/:id` | — | `204` eliminado, `400` id inválido, `404` no encontrado |

Cualquier otra ruta responde `404`. Un error inesperado responde `500` y se registra en la consola.

### Formato de un cliente

```json
{
  "id": "1",
  "nombre": "Ana Torres",
  "email": "ana.torres@correo.com",
  "createdAt": "2026-10-04T16:11:08.203613",
  "updatedAt": "2026-10-04T16:11:08.203613"
}
```

- **`id` es texto:** la columna es `BIGSERIAL` (entero de 64 bits) y JSON no puede representar esos números con seguridad, así que se envía como string. La versión con `pg` y el servicio de productos hacen lo mismo.
- **Fechas sin zona horaria:** las columnas son `TIMESTAMP`, no `TIMESTAMPTZ`.
- **`updatedAt`:** lo actualiza el trigger `trg_clientes_updated_at` de la base de datos en cada modificación.

### Validaciones y errores

| Caso | Código | Mensaje |
|------|--------|---------|
| `id` que no es un entero positivo (`abc`, `1.5`, `0`, demasiado grande) | `400` | `El id debe ser un entero positivo` |
| Body que no es un objeto JSON (por ejemplo un array) | `400` | `El cuerpo debe ser un objeto JSON` |
| JSON mal formado | `400` | `El cuerpo de la petición no es un JSON válido` |
| `nombre` o `email` vacío o que no es texto | `400` | `"campo" es obligatorio y debe ser texto` |
| `nombre` de más de 100 caracteres o `email` de más de 255 | `400` | `"campo" no puede superar N caracteres` |
| PUT sin `nombre` ni `email` | `400` | `No hay campos para actualizar` |
| Email que ya usa otro cliente (índice único `idx_clientes_email`) | `409` | `El email ya está registrado` |
| Cliente inexistente | `404` | `Cliente no encontrado` |

## Requisitos

- **Node.js 22.18 o superior**, porque Prisma 8 lo exige.
- **pnpm 11.20 o superior**, declarado en `devEngines` de `package.json`.
- **PostgreSQL** con los roles, bases y tablas de [`database/`](../database/README.md). Como mínimo hay que ejecutar `01-roles-y-bases.sql` y `02-tablas-cliente.sql`.

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `PORT` | `3001` | Puerto del servicio |
| `DATABASE_URL` | `postgresql://cliente_user:cliente_pass_123@localhost:5432/cliente_db` | Conexión a PostgreSQL. La usan el servicio y el CLI de Prisma. Es obligatoria: sin ella el servicio no arranca. |

`dotenv` no expande variables dentro de otras (por ejemplo `${DB_USER}`), así que la URL debe escribirse completa.

## Ejecutar en local

```bash
cd cliente
pnpm install
cp .env.example .env
pnpm db:init   # firma la base de datos con el contrato de Prisma (ver abajo)
pnpm dev
```

Scripts disponibles:

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `tsx watch index.ts` | Desarrollo con recarga automática |
| `start` | `tsx index.ts` | Ejecutar el servicio |
| `typecheck` | `tsc --noEmit` | Chequeo de tipos |
| `contract:emit` | `prisma contract emit` | Regenera `prisma/contract.json` y `prisma/contract.d.ts` desde `contract.prisma` |
| `db:init` | `prisma db init` | Crea lo que falte según el contrato y firma la base de datos |

No hay paso de compilación: el servicio se ejecuta directamente con `tsx`, tanto en local como en Docker.

Al recibir `SIGINT` o `SIGTERM` (Ctrl+C o `docker stop`), el servidor deja de aceptar peticiones, cierra la conexión a la base de datos y termina.

## Ejemplos de curl

```bash
# Estado del servicio
curl http://localhost:3001/health

# Listar clientes
curl http://localhost:3001/clientes

# Obtener cliente por id
curl http://localhost:3001/clientes/1

# Crear cliente
curl -X POST http://localhost:3001/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Perez", "email": "juan@correo.com"}'

# Crear cliente con email repetido → 409
curl -X POST http://localhost:3001/clientes \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Otro", "email": "juan@correo.com"}'

# Actualizar solo el nombre
curl -X PUT http://localhost:3001/clientes/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Juan Pérez Gómez"}'

# Eliminar cliente → 204
curl -X DELETE http://localhost:3001/clientes/1
```

## Persistencia con Prisma 8

### El contrato

El modelo de datos está en [`prisma/contract.prisma`](prisma/contract.prisma). El modelo se llama `Cliente`, pero apunta a la tabla existente `clientes`:

```prisma
model Cliente {
  id        BigInt       @id(map: "clientes_pkey") @default(autoincrement())
  nombre    VarChar(100)
  email     VarChar(255)
  createdAt Timestamp    @default(now()) @map("created_at")
  updatedAt Timestamp    @default(now()) @map("updated_at")

  @@index([email], map: "idx_clientes_email", unique: true)
  @@index([nombre], map: "idx_clientes_nombre")
  @@map("clientes")
}
```

- `@@map("clientes")` asocia el modelo a la tabla, y `@map(...)` asocia cada campo en camelCase a su columna en snake_case.
- Los tipos y los índices coinciden exactamente con `database/02-tablas-cliente.sql`. Se obtuvieron con `prisma contract infer`.
- El código accede a la tabla con `db.orm.public.Cliente` (ver [`src/models/clientes.ts`](src/models/clientes.ts)).

### La tabla la crean los scripts SQL, no Prisma

La tabla `clientes` le pertenece al usuario `postgres`, y `cliente_user` solo tiene permisos de lectura y escritura (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). Por eso **Prisma no crea ni modifica la estructura de la tabla**. Así se usa:

- **`prisma db init`** compara el contrato con la base de datos. Si coinciden, no cambia nada y solo "firma" la base, es decir, guarda en el esquema `prisma_contract` qué versión del contrato tiene. Solo hace cambios aditivos, así que se puede ejecutar siempre. El contenedor de Docker lo ejecuta en cada arranque.
- **Para cambiar la estructura de la tabla:**
  1. Modifica `database/02-tablas-cliente.sql` y aplica el cambio en la base de datos.
  2. Actualiza `prisma/contract.prisma` para que coincida.
  3. Ejecuta `pnpm contract:emit` para regenerar `contract.json` y `contract.d.ts`.
  4. Ejecuta `pnpm db:init` para firmar la base de datos con el contrato nuevo.

  Para revisar si la base de datos coincide con el contrato: `pnpm exec prisma db verify`.

### Detalles a tener en cuenta

- **Fechas y `Temporal`:** Prisma 8 lee las columnas de fecha con la API `Temporal` de JavaScript, que todavía no está disponible por defecto en Node: no estaba ni en Node 24 (la imagen de Docker) ni en Node 26.10 (el entorno local). Sin ella, cualquier consulta a un cliente falla con `RUNTIME.TEMPORAL_UNAVAILABLE`. Por eso `src/config/database.ts` carga `temporal-polyfill/global` antes de crear el cliente de Prisma, y `tsconfig.json` incluye `"ESNext.Temporal"` en `lib` para los tipos.
- **`id` como `bigint`:** Prisma devuelve las columnas `BIGINT` como `bigint` de JavaScript. El controlador convierte el id de la URL con `BigInt(...)`, y `src/app.ts` configura Express para enviarlo como texto en el JSON.
- **Tipo `Varchar<N>`:** Prisma tipa las columnas `VARCHAR(N)` como `Varchar<N>`, un string que TypeScript distingue de un string común. El controlador valida la longitud y recién entonces convierte el texto a ese tipo (ver `textoValido` en el controlador).
- **Errores de PostgreSQL:** Prisma conserva el código SQLSTATE en `err.sqlState`. `errorHandler` usa `23505` (valor duplicado) para responder `409`.
- **Versión preliminar:** `prisma` está en `8.0.0-rc.20` y `@prisma/orm-postgres` en `8.0.0-rc.14`. Esas versiones traen dos copias distintas de la librería `arktype`, lo que hace fallar el chequeo de tipos. `pnpm-workspace.yaml` las unifica con un `override`. Si se igualan las versiones de Prisma, el override puede quitarse.

## Docker

El servicio tiene su propio [`Dockerfile`](Dockerfile) y se levanta con el `docker-compose.yml` de la raíz:

```bash
docker compose up -d --build cliente
```

Detalles en [`DOCKER.md`](../DOCKER.md).
