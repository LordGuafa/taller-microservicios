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
