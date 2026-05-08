FROM node:20-alpine

WORKDIR /usr/src/app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages

COPY identity-service/package.json ./package.json
COPY identity-service/src ./src
COPY identity-service/project.json ./project.json

RUN pnpm install --prod --filter="./identity-service"

EXPOSE 3001

CMD ["node", "src/server.js"]

