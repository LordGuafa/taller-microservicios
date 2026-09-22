# producto-api

Servicio de catálogo de productos en el taller de microservicios. Expone consulta y creación de productos con datos **en memoria** (aún no tiene persistencia real).

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
- **No necesita PostgreSQL**: los datos viven en `src/data/productos.js`.

## Variables de entorno

[`producto/.env.example`](../producto/.env.example) solo contiene `PORT=` sin valor. El servicio no lee ninguna variable de entorno; el puerto por defecto es `3002`.

## Ejecutar en local

```bash
cd producto
pnpm install
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

- **Sin persistencia:** los productos se guardan en un arreglo (`src/data/productos.js`) que se pierde al reiniciar el proceso. Este servicio está **pendiente de migrar a una base de datos persistente** (la infraestructura `producto_db` ya existe en [`database/`](../database/README.md)).
- `pg` figura en las dependencias de `package.json` pero **no se usa** actualmente; queda listo para la migración.
