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

### `cliente/Dockerfile` (TypeScript: hay que compilar con `tsc`)

**Con pnpm:**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

**Con npm:**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

> Con npm necesitas un `package-lock.json`: genera uno con `cd cliente && npm install --package-lock-only`.

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
      - "5432:5432"
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
    ports: ["3001:3001"]
    environment:
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: cliente_db
      DB_USER: cliente_user
      DB_PASSWORD: cliente_pass_123
    depends_on:
      postgres:
        condition: service_healthy

  producto:
    build: ./producto
    ports: ["3002:3002"]
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
    ports: ["3003:3003"]
    environment:
      PORT: 3003
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: compra_db
      DB_USER: compra_user
      DB_PASSWORD: compra_pass_123
      CLIENTE_API_URL: http://cliente:3001
      PRODUCTO_API_URL: http://producto:3002
    depends_on:
      - cliente
      - producto

volumes:
  pgdata:
```

---

## 4. Puntos clave

- **Dentro de Docker, nada usa `localhost`**: las bases de datos se referencian con `DB_HOST: postgres` y los servicios entre sí con `http://cliente:3001`, `http://producto:3002` (nombres de los servicios en compose).
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
curl http://localhost:3001/clientes
curl http://localhost:3002/productos
curl http://localhost:3003/compras
```
