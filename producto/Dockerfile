FROM node:24-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src ./src
COPY prisma ./prisma

EXPOSE 3002

CMD ["node", "src/server.js"]
