FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

COPY api-gateway/package.json ./package.json
COPY api-gateway/src ./src
COPY api-gateway/project.json ./project.json

RUN pnpm install --prod --filter="./api-gateway"

EXPOSE 3000

CMD ["node", "src/server.js"]

