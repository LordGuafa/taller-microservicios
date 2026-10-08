# compra-api

Servicio de compras en el taller de microservicios. Registra compras con persistencia en PostgreSQL (`compra_db`) usando **Sequelize ORM** y se comunica con `cliente-api` y `producto-api` vía HTTP (`fetch`) para validar que el cliente y el producto existan y que haya stock suficiente antes de crear o actualizar una compra.

**Stack:** JavaScript (CommonJS) · Express 4 · Sequelize ORM 6 · Puerto `3003`

## Endpoints

| Método | Path                           | Query / Body                                                                 | Respuestas |
|--------|--------------------------------|------------------------------------------------------------------------------|------------|
| GET    | `/health`                      | —                                                                            | `200` `{ status: "ok" }` |
| GET    | `/compras`                     | Query opcional: `?clienteId=1&productoId=2`                                   | `200` lista de compras con sus detalles |
| GET    | `/compras/:id`                 | —                                                                            | `200` compra con detalles, `404` no encontrada |
| GET    | `/compras/cliente/:clienteId`  | —                                                                            | `200` compras del cliente con detalles |
| GET    | `/compras/producto/:productoId`| —                                                                            | `200` compras del producto con detalles |
| GET    | `/compras/:id/detalles`        | —                                                                            | `200` detalles de la compra, `404` no encontrada |
| POST   | `/compras`                     | `{ "clienteId": number, "productoId": number, "cantidad": number }`          | `201` creada, `400` validación o stock, `404` no existe, `503` servicio caído |
| PUT    | `/compras/:id`                 | `{ "clienteId"?: number, "productoId"?: number, "cantidad"?: number }`      | `200` actualizada, `400` validación o stock, `404` no encontrada, `503` caído |
| DELETE | `/compras/:id`                 | —                                                                            | `200` eliminada, `404` no encontrada |

## Flujo de `POST /compras` y `PUT /compras/:id`

1. Valida los campos requeridos (`clienteId`, `productoId`, `cantidad`).
2. Consulta `cliente-api` (`GET /clientes/:id`) y `producto-api` (`GET /productos/:id`) con `fetch`.
3. Si alguno de los servicios externos no responde, retorna `503`.
4. Si el cliente o el producto no existen (404 de los microservicios), retorna `404`.
5. Si `producto.stock < cantidad`, retorna `400` por stock insuficiente.
6. Mediante una transacción administrada por **Sequelize** (`sequelize.transaction`), persiste o actualiza la cabecera en `compras` y el desglose en `compra_detalle` con el precio unitario y total recalculados.

## Requisitos

- Node.js 18+ (usa `fetch` nativo).
- pnpm (o npm).
- `cliente-api` (puerto 3001) y `producto-api` (puerto 3002) **ejecutándose** para validaciones.
- PostgreSQL en ejecución con la base `compra_db` configurada mediante los scripts de [`database/`](../database/README.md).

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable           | Valor por defecto                                                    | Descripción                                  |
|--------------------|----------------------------------------------------------------------|----------------------------------------------|
| `PORT`             | `3003`                                                               | Puerto del servicio                          |
| `CLIENTE_API_URL`  | `http://localhost:3001`                                              | URL base de cliente-api                      |
| `PRODUCTO_API_URL` | `http://localhost:3002`                                              | URL base de producto-api                     |
| `DATABASE_URL`     | `postgresql://compra_user:compra_pass_123@localhost:5432/compra_db`   | Cadena de conexión principal (Sequelize)     |
| `DB_HOST`          | `localhost`                                                          | Host alternativo                             |
| `DB_PORT`          | `5432`                                                               | Puerto alternativo                           |
| `DB_NAME`          | `compra_db`                                                          | Base de datos alternativa                    |
| `DB_USER`          | `compra_user`                                                        | Usuario alternativo                          |
| `DB_PASSWORD`      | `compra_pass_123`                                                    | Contraseña alternativa                       |

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

## Ejemplos con curl

```bash
# Listar todas las compras
curl http://localhost:3003/compras

# Filtrar compras por cliente
curl http://localhost:3003/compras/cliente/1

# Filtrar compras por producto
curl http://localhost:3003/compras/producto/1

# Obtener compra con id 1
curl http://localhost:3003/compras/1

# Obtener solo los items/detalles de la compra 1
curl http://localhost:3003/compras/1/detalles

# Crear compra válida
curl -X POST http://localhost:3003/compras \
  -H "Content-Type: application/json" \
  -d '{"clienteId": 1, "productoId": 1, "cantidad": 2}'

# Actualizar compra
curl -X PUT http://localhost:3003/compras/1 \
  -H "Content-Type: application/json" \
  -d '{"cantidad": 3}'

# Eliminar compra
curl -X DELETE http://localhost:3003/compras/1
```
