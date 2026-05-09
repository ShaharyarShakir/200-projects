FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

COPY post-service/package.json ./package.json
COPY post-service/src ./src
COPY post-service/project.json ./project.json

RUN pnpm install --prod --filter="./post-service"

EXPOSE 3002

CMD ["node", "src/server.js"]

