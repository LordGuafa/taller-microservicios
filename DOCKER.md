# Dockerización de los Microservicios

Guía para ejecutar el taller con Docker. Cada microservicio (**cliente**, **producto** y **compra-api**) tiene su **propia imagen de PostgreSQL**, su propio volumen, usuario, base de datos y red. No hay una base compartida: el despliegue simula servicios independientes, como ocurriría en Azure con una base de datos por servicio (*Database per Service*).

## Estructura de archivos

```
taller-microservicios/
├── docker-compose.yml          # 3 servicios + 3 PostgreSQL independientes
├── database/
│   ├── cliente/
│   │   ├── 01-tablas.sql
│   │   └── 02-datos-prueba.sql
│   ├── producto/
│   │   ├── 01-tablas.sql
│   │   └── 02-datos-prueba.sql
│   └── compra/
│       ├── 01-tablas.sql
│       └── 02-datos-prueba.sql
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

- **Una sola etapa, sin `tsc`:** el servicio se ejecuta directamente con `tsx`.
- **Node 24:** Prisma 8 necesita Node 22.18 o superior.
- **Se instalan las devDependencies:** `tsx` y el CLI de `prisma` son necesarios para arrancar.
- **`pnpm-workspace.yaml` es obligatorio:** sin él, pnpm no ejecuta los scripts de instalación de `esbuild` y `workerd`, ni aplica el override de `arktype`.
- **Preparación de la base de datos al arrancar:** `prisma db init` firma la base de datos con el contrato de Prisma antes de levantar el servidor.

### `producto/Dockerfile` y `compra-api/Dockerfile` (JavaScript, sin compilación)

```dockerfile
# producto usa Node 24; compra-api usa Node 20
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY src ./src
COPY prisma ./prisma
COPY index.js ./
EXPOSE 3002
CMD ["node", "index.js"]
```

`compra-api/Dockerfile` es equivalente, pero usa `node:20-alpine`, pnpm 10, solo copia `src/`, expone `3003` y arranca con `node src/server.js`.

---

## 3. `docker-compose.yml` (raíz del repo)

```yaml
services:
  # ------------------------------------------------------------
  # Microservicio cliente + su PostgreSQL independiente
  # ------------------------------------------------------------
  postgres-cliente:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cliente_user
      POSTGRES_PASSWORD: cliente_pass_123
      POSTGRES_DB: cliente_db
    ports:
      - "5433:5432"
    volumes:
      - pgdata-cliente:/var/lib/postgresql/data
      - ./database/cliente:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cliente_user -d cliente_db"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - cliente-net

  cliente:
    build: ./cliente
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://cliente_user:cliente_pass_123@postgres-cliente:5432/cliente_db
    depends_on:
      postgres-cliente:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
    networks:
      - cliente-net

  # ------------------------------------------------------------
  # Microservicio producto + su PostgreSQL independiente
  # ------------------------------------------------------------
  postgres-producto:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: producto_user
      POSTGRES_PASSWORD: producto_pass_123
      POSTGRES_DB: producto_db
    ports:
      - "5434:5432"
    volumes:
      - pgdata-producto:/var/lib/postgresql/data
      - ./database/producto:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U producto_user -d producto_db"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - producto-net

  producto:
    build: ./producto
    ports:
      - "3002:3002"
    environment:
      PORT: 3002
      DATABASE_URL: postgresql://producto_user:producto_pass_123@postgres-producto:5432/producto_db
    depends_on:
      postgres-producto:
        condition: service_healthy
    networks:
      - producto-net

  # ------------------------------------------------------------
  # Microservicio compra + su PostgreSQL independiente
  # ------------------------------------------------------------
  postgres-compra:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: compra_user
      POSTGRES_PASSWORD: compra_pass_123
      POSTGRES_DB: compra_db
    ports:
      - "5435:5432"
    volumes:
      - pgdata-compra:/var/lib/postgresql/data
      - ./database/compra:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U compra_user -d compra_db"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - compra-net

  compra-api:
    build: ./compra-api
    ports:
      - "3003:3003"
    environment:
      PORT: 3003
      DATABASE_URL: postgresql://compra_user:compra_pass_123@postgres-compra:5432/compra_db
      CLIENTE_API_URL: http://cliente:3001
      PRODUCTO_API_URL: http://producto:3002
    depends_on:
      postgres-compra:
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
    networks:
      # compra-api solo comparte red con las APIs que consume por HTTP.
      - compra-net
      - cliente-net
      - producto-net

networks:
  cliente-net:
  producto-net:
  compra-net:

volumes:
  pgdata-cliente:
  pgdata-producto:
  pgdata-compra:
```

---

## 4. Puntos clave

- **Tres PostgreSQL independientes:** `postgres-cliente`, `postgres-producto` y `postgres-compra`. Cada uno tiene su propia base, usuario, contraseña, volumen y scripts de inicialización.
- **Redes aisladas:** cada base solo está en la red de su microservicio (`cliente-net`, `producto-net`, `compra-net`). Ningún servicio está configurado para conectarse a la base de otro.
- **Dentro de Docker, nada usa `localhost` para las bases:** cada servicio apunta al host de **su** contenedor:
  - cliente → `postgres-cliente:5432`
  - producto → `postgres-producto:5432`
  - compra-api → `postgres-compra:5432`
- **Comunicación HTTP:** `compra-api` usa `http://cliente:3001` y `http://producto:3002`. Por eso comparte red con esas dos APIs, pero no con sus bases de datos.
- **Puertos publicados en el host** para inspección manual:
  - `localhost:5433` → `cliente_db`
  - `localhost:5434` → `producto_db`
  - `localhost:5435` → `compra_db`
- **Inicialización automática:** cada carpeta de `database/` se monta en el `docker-entrypoint-initdb.d` de su contenedor. PostgreSQL ejecuta `01-tablas.sql` y luego `02-datos-prueba.sql` **una sola vez**, al crearse el volumen correspondiente.
- **Re-ejecutar scripts:** `docker compose down -v` borra los tres volúmenes y fuerza la inicialización de nuevo en el siguiente `docker compose up`.
- **Si vienes de la versión anterior con un solo `postgres`:** elimina el contenedor y el volumen antiguos antes de levantar la nueva configuración:
  ```bash
  docker compose down -v --remove-orphans
  docker compose up -d --build
  ```
- **La tabla `clientes` la crea `database/cliente/01-tablas.sql`, no Prisma.** Al arrancar, `prisma db init` comprueba el contrato y firma la base en el esquema `prisma_contract`.
- No copies los `.env` a las imágenes (están en `.dockerignore`); las variables se inyectan desde `docker-compose.yml`.

## 5. Conexión manual a cada base

```bash
# Cliente
psql -h localhost -p 5433 -U cliente_user -d cliente_db

# Producto
psql -h localhost -p 5434 -U producto_user -d producto_db

# Compra
psql -h localhost -p 5435 -U compra_user -d compra_db
```

O directamente con Docker:

```bash
docker compose exec postgres-cliente psql -U cliente_user -d cliente_db
docker compose exec postgres-producto psql -U producto_user -d producto_db
docker compose exec postgres-compra psql -U compra_user -d compra_db
```

## 6. Comandos

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

# Detener y borrar los datos de las tres bases
docker compose down -v
```

## 7. Verificación

```bash
# Estado de los contenedores: cliente debe aparecer como "(healthy)"
docker compose ps

curl http://localhost:3001/health
curl http://localhost:3001/clientes
curl http://localhost:3002/productos
curl http://localhost:3003/compras
```

Si `cliente` no queda sano, revisa sus logs con `docker compose logs cliente`. Al arrancar debe mostrar el resultado de `prisma db init`, con `"database signed"`, y luego `Servidor escuchando en http://localhost:3001`.
