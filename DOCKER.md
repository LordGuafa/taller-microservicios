# Dockerización de los Microservicios

Guía para ejecutar todo el taller (3 microservicios + PostgreSQL) con Docker.

## Estructura de archivos

```
taller-microservicios/
├── docker-compose.yml          # orquesta los 3 servicios + PostgreSQL
├── database/
│   ├── 01-roles-y-bases.sql
│   ├── 02-tablas-cliente.sql
│   ├── 03-tablas-producto.sql
│   ├── 04-tablas-compra.sql
│   └── 05-datos-prueba.sql
├── cliente/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── index.ts                # punto de entrada (se ejecuta con tsx)
│   ├── prisma.config.ts        # configuración del CLI de Prisma
│   ├── prisma/                 # contrato de Prisma (contract.prisma + generados)
│   ├── migrations/             # estado de Prisma
│   └── src/
├── producto/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
└── compra-api/
    ├── Dockerfile
    ├── .dockerignore
    └── src/
```

> Cada servicio tiene su propio `Dockerfile` (dentro de su carpeta) y un `docker-compose.yml` único en la raíz.

---

## 1. `.dockerignore` (idéntico en `cliente/`, `producto/` y `compra-api/`)

```
node_modules
dist
.env
.git
```

---

## 2. Dockerfiles

### `cliente/Dockerfile` (TypeScript + Prisma 8, se ejecuta con `tsx`)

```dockerfile
# Prisma 8 exige Node >= 22.18
FROM node:24-alpine
WORKDIR /app

# La versión de pnpm debe cumplir "devEngines" de package.json (^11.20.0)
RUN npm install -g pnpm@11

# Dependencias primero, para aprovechar la caché de capas de Docker.
# pnpm-workspace.yaml trae allowBuilds y el override de arktype.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Se instalan también las devDependencies: el servicio corre con tsx
# y el arranque usa el CLI de prisma para preparar la base de datos.
RUN pnpm install --frozen-lockfile

COPY tsconfig.json prisma.config.ts index.ts ./
COPY prisma ./prisma
COPY migrations ./migrations
COPY src ./src

EXPOSE 3001

# 1. prisma db init crea las tablas que falten según el contrato y firma la BD.
#    Solo hace cambios aditivos, así que es seguro ejecutarlo en cada arranque.
# 2. exec reemplaza el shell por node, para que reciba SIGTERM y cierre ordenadamente.
CMD ["sh", "-c", "pnpm exec prisma db init && exec node_modules/.bin/tsx index.ts"]
```

Diferencias con los otros servicios:

- **Una sola etapa, sin `tsc`:** el servicio se ejecuta directamente con `tsx`, igual que con `pnpm start` en local. No se genera `dist/`.
- **Node 24:** Prisma 8 necesita Node 22.18 o superior. `producto` y `compra-api` siguen en Node 20.
- **Se instalan las devDependencies:** `tsx` y el CLI de `prisma` son de desarrollo, pero el contenedor los necesita para arrancar.
- **`pnpm-workspace.yaml` es obligatorio:** sin él, pnpm no ejecuta los scripts de instalación de `esbuild` y `workerd`, ni aplica el override de `arktype`.
- **Preparación de la base de datos al arrancar:** `prisma db init` firma la base de datos con el contrato de Prisma antes de levantar el servidor. Si falla (por ejemplo, porque la base no responde o el contrato no coincide con la tabla), el contenedor se detiene y el error aparece en `docker compose logs cliente`.
- **Solo pnpm:** no hay variante con npm. El proyecto depende de `pnpm-workspace.yaml` y de `pnpm-lock.yaml`.

### `producto/Dockerfile` y `compra-api/Dockerfile` (JavaScript, sin compilación)

**Con pnpm:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY src ./src
EXPOSE 3002   # usa 3003 en compra-api/Dockerfile
CMD ["node", "src/server.js"]
```

**Con npm:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 3002   # usa 3003 en compra-api/Dockerfile
CMD ["node", "src/server.js"]
```

---

## 3. `docker-compose.yml` (raíz del repo)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5433:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./database:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  cliente:
    build: ./cliente
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      # Prisma se conecta con una sola URL (ver src/config/database.ts)
      DATABASE_URL: postgresql://cliente_user:cliente_pass_123@postgres:5432/cliente_db
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s

  producto:
    build: ./producto
    ports:
      - "3002:3002"
    environment:
      PORT: 3002
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: producto_db
      DB_USER: producto_user
      DB_PASSWORD: producto_pass_123
    depends_on:
      postgres:
        condition: service_healthy

  compra-api:
    build: ./compra-api
    ports:
      - "3003:3003"
    environment:
      PORT: 3003
      DATABASE_URL: postgresql://compra_user:compra_pass_123@postgres:5432/compra_db
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: compra_db
      DB_USER: compra_user
      DB_PASSWORD: compra_pass_123
      CLIENTE_API_URL: http://cliente:3001
      PRODUCTO_API_URL: http://producto:3002
    depends_on:
      postgres:
        condition: service_healthy
      cliente:
        condition: service_healthy
      producto:
        condition: service_started
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3003/health || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 15s

volumes:
  pgdata:
```

---

## 4. Puntos clave

- **Dentro de Docker, nada usa `localhost`**: las bases de datos se referencian con el host `postgres` (`DB_HOST: postgres` en producto y compra-api, `@postgres:5432` dentro de `DATABASE_URL` en cliente) y los servicios entre sí con `http://cliente:3001`, `http://producto:3002` (nombres de los servicios en compose).
- **PostgreSQL se publica en el puerto `5433` del host** (`"5433:5432"`), para no chocar con un PostgreSQL local en el `5432`. Dentro de la red de Docker sigue siendo `postgres:5432`. Para conectarte desde tu máquina: `psql -h localhost -p 5433 -U postgres`.
- **cliente usa `DATABASE_URL`**, no las variables `DB_*`: Prisma se conecta con una sola URL.
- **Orden de arranque:** `compra-api` espera a que `cliente` esté sano (`service_healthy`). El healthcheck de `cliente` consulta `GET /health`, y ese endpoint solo responde cuando `prisma db init` terminó y el servidor ya está escuchando. Por eso `start_period: 20s`: el primer arranque tarda unos segundos más.
- **La tabla `clientes` la crea `02-tablas-cliente.sql`, no Prisma.** Al arrancar, `prisma db init` comprueba que la tabla coincide con el contrato (`cliente/prisma/contract.prisma`) y firma la base de datos en el esquema `prisma_contract`. Si cambias el contrato, reconstruye la imagen (`docker compose up -d --build cliente`).
- Los scripts de `database/` se montan en `/docker-entrypoint-initdb.d` y se ejecutan **una sola vez**, al crearse el volumen `pgdata`. Para re-ejecutarlos: `docker compose down -v` (borra los datos) y `docker compose up`.
- Si los scripts con `\c` fallan en tu versión de psql, ejecútalos a mano:
  ```bash
  docker compose exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/01-roles-y-bases.sql
  # ... repetir con 02, 03, 04, 05
  ```
- No copies los `.env` a las imágenes (están en `.dockerignore`); las variables se inyectan desde `docker-compose.yml`.

## 5. Comandos

```bash
# Levantar todo (construye las imágenes la primera vez)
docker compose up --build

# En segundo plano
docker compose up -d --build

# Construir solo un servicio
docker compose build cliente

# Ver logs
docker compose logs -f compra-api

# Detener
docker compose down

# Detener y borrar el volumen de la base de datos
docker compose down -v
```

## 6. Verificación

```bash
# Estado de los contenedores: cliente debe aparecer como "(healthy)"
docker compose ps

curl http://localhost:3001/health
curl http://localhost:3001/clientes
curl http://localhost:3002/productos
curl http://localhost:3003/compras
```

Si `cliente` no queda sano, revisa sus logs con `docker compose logs cliente`. Al arrancar debe mostrar el resultado de `prisma db init`, con `"database signed"`, y luego `Servidor escuchando en http://localhost:3001`.
