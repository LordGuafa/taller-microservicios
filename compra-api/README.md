# compra-api

Servicio de compras en el taller de microservicios. Registra compras con persistencia en PostgreSQL (`compra_db`) y se comunica con `cliente-api` y `producto-api` vía HTTP (`fetch`) para validar que el cliente y el producto existan y que haya stock suficiente antes de crear una compra.

**Stack:** JavaScript (CommonJS) · Express 4 · Puerto `3003`

## Flujo de `POST /compras`

1. Valida que `clienteId`, `productoId` y `cantidad` estén presentes (`400` si faltan).
2. Consulta `cliente-api` (`GET /clientes/:id`) y `producto-api` (`GET /productos/:id`) con `fetch`.
3. Si alguno de los dos servicios no responde, responde `503`.
4. Si el cliente o el producto no existen (404 de los servicios), responde `404`.
5. Si `producto.stock < cantidad`, responde `400`.
6. En una transacción atómica de PostgreSQL, inserta la compra en `compras` y el desglose en `compra_detalle` con `total = producto.precio * cantidad` y responde `201`.

## Endpoints

| Método | Path        | Body                                             | Respuestas |
|--------|-------------|--------------------------------------------------|------------|
| GET    | `/compras`  | —                                                | `200` lista de compras |
| GET    | `/compras/:id` | —                                              | `200` compra, `404` no encontrada |
| POST   | `/compras`  | `{ "clienteId": number, "productoId": number, "cantidad": number }` | `201` creada, `400` faltan campos o stock insuficiente, `404` cliente/producto no existe, `503` servicio dependiente caído |

## Requisitos

- Node.js 18+ (usa el `fetch` nativo; no hay `engines` declarado en `package.json`).
- pnpm (o npm).
- `cliente-api` (puerto 3001) y `producto-api` (puerto 3002) **ejecutándose**, porque `POST /compras` los consulta para validar.
- PostgreSQL en ejecución con la base `compra_db` configurada mediante los scripts de [`database/`](../database/README.md).

## Variables de entorno

Copia `.env.example` a `.env`:

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

## Ejecutar en local

```bash
# Terminal 1 (cliente-api)
cd cliente && pnpm install && pnpm dev

# Terminal 2 (producto-api)
cd producto && pnpm install && pnpm dev

# Terminal 3 (compra-api)
cd compra-api
pnpm install
cp .env.example .env
pnpm dev
```

Scripts disponibles:

| Script    | Comando                  | Descripción          |
|-----------|--------------------------|----------------------|
| `dev`     | `nodemon src/server.js`  | Desarrollo con watch |
| `start`   | `node src/server.js`     | Ejecución directa    |

## Ejemplos de curl

```bash
# Listar compras
curl http://localhost:3003/compras

# Crear compra válida (cliente 1 existe en cliente-api y producto 1 tiene stock en producto-api)
curl -X POST http://localhost:3003/compras \
  -H "Content-Type: application/json" \
  -d '{"clienteId": 1, "productoId": 1, "cantidad": 2}'

# Cliente inexistente → 404
curl -X POST http://localhost:3003/compras \
  -H "Content-Type: application/json" \
  -d '{"clienteId": 999, "productoId": 1, "cantidad": 1}'

# Campos faltantes → 400
curl -X POST http://localhost:3003/compras \
  -H "Content-Type: application/json" \
  -d '{"clienteId": 1}'
```

## Notas

- Las compras se almacenan en la tabla `compras` y su desglose en `compra_detalle` dentro de `compra_db` mediante el driver `pg` y transacciones SQL (`BEGIN` / `COMMIT`).
- El servidor verifica la conexión a PostgreSQL antes de comenzar a escuchar en el puerto HTTP.
