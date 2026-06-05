FROM node:22-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD [ "pnpm", "start" ]
