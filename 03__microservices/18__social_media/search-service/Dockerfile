FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

COPY search-service/package.json ./package.json
COPY search-service/src ./src
COPY search-service/project.json ./project.json

RUN pnpm install --prod --filter="./search-service"

EXPOSE 3004

CMD ["node", "src/server.js"]

