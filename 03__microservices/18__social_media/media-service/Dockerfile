FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

COPY media-service/package.json ./package.json
COPY media-service/src ./src
COPY media-service/project.json ./project.json

RUN pnpm install --prod --filter="./media-service"

EXPOSE 3003

CMD ["node", "src/server.js"]

