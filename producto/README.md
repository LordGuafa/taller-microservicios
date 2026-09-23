# producto-api

Servicio de catálogo de productos en el taller de microservicios. Expone consulta y creación de productos con persistencia en PostgreSQL.

**Stack:** JavaScript (CommonJS) · Express 5 · Puerto `3002`

## Endpoints

| Método | Path          | Body                                          | Respuestas |
|--------|---------------|-----------------------------------------------|------------|
| GET    | `/productos`  | —                                             | `200` lista de productos |
| GET    | `/productos/:id` | —                                           | `200` producto, `404` no encontrado |
| POST   | `/productos`  | `{ "nombre": string, "precio": number, "stock": number }` | `201` creado, `400` faltan campos |

Los datos de ejemplo son un teclado mecánico y un mouse inalámbrico. El id del siguiente producto creado se asigna con un contador interno.

## Requisitos

- Node.js 18+ (Express 5 lo requiere; no hay `engines` declarado en `package.json`).
- pnpm (o `npm`, también hay `package-lock.json`).
- PostgreSQL en ejecución con la base `producto_db` configurada mediante los scripts de [`database/`](../database/README.md).

## Variables de entorno

[`producto/.env.example`](../producto/.env.example) contiene el puerto y las credenciales de conexión a `producto_db`. Cópialo como `.env` y ajusta los valores si es necesario.

## Ejecutar en local

```bash
cd producto
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
```

## Notas

- Los productos se almacenan en la tabla `productos` de `producto_db` mediante el driver `pg` y consultas SQL parametrizadas.
- El servidor verifica la conexión a PostgreSQL antes de comenzar a escuchar en el puerto HTTP.
