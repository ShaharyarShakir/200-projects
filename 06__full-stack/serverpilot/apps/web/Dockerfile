# Build stage
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy workspace files from monorepo root to leverage layer caching
COPY package.json bun.lock* ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy SvelteKit source files
COPY apps/web/ ./apps/web/

# Inject Vite build-time public environment variables
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

# Build SvelteKit node bundle
WORKDIR /app/apps/web
RUN bun run build

# Production runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy built code and dependencies manifest
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Expose port
EXPOSE 3000

# Default runtime settings
ENV PORT=3000
ENV NODE_ENV=production

# Run node server
CMD ["node", "build"]
