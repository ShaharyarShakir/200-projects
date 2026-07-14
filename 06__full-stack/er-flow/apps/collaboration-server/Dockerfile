FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @eraser/tsconfig build || true
RUN pnpm --filter @eraser/types build || true
RUN pnpm --filter @eraser/database build
RUN pnpm --filter @eraser/auth build
RUN pnpm --filter collaboration-server build
EXPOSE 1234
CMD ["pnpm", "--filter", "collaboration-server", "start"]
