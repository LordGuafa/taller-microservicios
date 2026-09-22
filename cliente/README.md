# cliente-api

Servicio de gestión de clientes en el taller de microservicios. Expone el CRUD de clientes y persiste en **PostgreSQL** usando el driver `pg` con SQL crudo (**sin ORM**).

**Stack:** TypeScript · Express 5 · PostgreSQL · pnpm · Puerto `3001`

## Endpoints

| Método | Path          | Body                                | Respuestas |
|--------|---------------|-------------------------------------|------------|
| GET    | `/clientes`   | —                                   | `200` lista de clientes, `500` error interno |
| GET    | `/clientes/:id` | —                                 | `200` cliente, `404` no encontrado, `500` |
| POST   | `/clientes`   | `{ "nombre": string, "email": string }` | `201` creado, `400` faltan campos, `409` email duplicado, `500` |

Errores: el email duplicado se detecta con el código de PostgreSQL `23505` y responde `409`. Un `id` no numérico o inexistente responde `404`.

## Requisitos

- Node.js 18+ (Express 5 y `tsx` lo requieren; no hay `engines` declarado en `package.json`).
- pnpm.
- PostgreSQL en ejecución con las bases y roles de [`database/`](../database/README.md).

## Variables de entorno

Copia `.env.example` a `.env`:

| Variable       | Valor por defecto      | Descripción                      |
|----------------|------------------------|----------------------------------|
| `PORT`         | `3001`                 | Puerto del servicio              |
| `DB_HOST`      | `localhost`            | Host de PostgreSQL               |
| `DB_PORT`      | `5432`                 | Puerto de PostgreSQL             |
| `DB_NAME`      | `cliente_db`           | Base de datos de clientes        |
| `DB_USER`      | `cliente_user`         | Usuario de BD con privilegios mínimos |
| `DB_PASSWORD`  | `cliente_pass_123`     | Contraseña del usuario de BD     |

## Ejecutar en local

```bash
cd cliente
pnpm install
cp .env.example .env
pnpm dev
```

Scripts disponibles:

| Script     | Comando                 | Descripción            |
|------------|-------------------------|------------------------|
| `dev`      | `tsx watch src/server.ts` | Desarrollo con watch   |
| `build`    | `tsc`                   | Compilar a `dist/`     |
| `start`    | `node dist/server.js`   | Ejecutar build compilado |
| `typecheck`| `tsc --noEmit`          | Chequeo de tipos       |

Al arrancar verifica la conexión con `pool.query("SELECT 1")` y no levanta el servidor si falla.

## Ejemplos de curl

```bash
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
```

## Enfoque SQL sin ORM

### Dónde están las queries

Todas las consultas viven en [`src/routes/clientes.routes.ts`](src/routes/clientes.routes.ts):

- Listar: `SELECT id, nombre, email, created_at, updated_at FROM clientes ORDER BY id`
- Obtener por id: `... WHERE id = $1`
- Crear: `INSERT INTO clientes (nombre, email) VALUES ($1, $2) RETURNING ...`

La conexión es un `Pool` de `pg` definido en [`src/config/database.ts`](src/config/database.ts). El modelado de datos es solo una interfaz TypeScript (`src/model/clientes.ts`), no un modelo con lógica de persistencia.

### Por qué se hizo así

Es un **requisito del taller**: evidenciar los costos de trabajar con SQL hardcodeado sin capa intermedia. La ausencia de ORM es deliberada y **no representa una recomendación de buena práctica**.

### Riesgos en un proyecto real

- **Mantenibilidad:** las queries quedan dispersas en cada archivo de rutas; un cambio de esquema obliga a localizarlas y actualizarlas manualmente en todo el código.
- **Sin migraciones automáticas:** los cambios de esquema no se versionan ni se aplican de forma reproducible (habría que gestionarlos con herramientas como Flyway, Knex, Prisma, Alembic, etc.).
- **Riesgo de inyección SQL:** usar parámetros posicionales (`$1`, `$2`) es lo que evita el ataque; concatenar strings en lugar de parametrizar lo reintroduce el fallo, y sin un ORM que force los parámetros es más fácil caer en él.
- **Sin mapeo objeto-relacional:** cada query devuelve filas que hay que convertir a objetos manualmente y los tipos pueden desincronizarse de las columnas reales.
- **Código duplicado:** comunes como "verificar si un email existe" se repiten en cada endpoint en lugar de centralizarse.
