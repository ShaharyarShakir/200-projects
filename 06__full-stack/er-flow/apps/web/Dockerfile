FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
ARG VITE_API_URL=http://localhost:3001
ARG VITE_COLLABORATION_URL=ws://localhost:1234
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_COLLABORATION_URL=$VITE_COLLABORATION_URL
RUN pnpm build --filter=web
EXPOSE 3000
CMD ["node", "apps/web/.output/server/index.mjs"]
