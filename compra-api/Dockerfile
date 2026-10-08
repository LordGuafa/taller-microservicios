FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod

COPY src ./src

EXPOSE 3003

CMD ["node", "src/server.js"]
