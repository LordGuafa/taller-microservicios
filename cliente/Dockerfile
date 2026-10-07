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
