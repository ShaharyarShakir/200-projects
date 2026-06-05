# build stage
FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# production stage

FROM node:22-alpine

# Set up PNPM_HOME and PATH for global installs
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest

RUN pnpm install -g serve

COPY --from=build /app/dist ./dist

EXPOSE 4000

CMD ["serve", "-s", "dist", "-l", "4000"]
