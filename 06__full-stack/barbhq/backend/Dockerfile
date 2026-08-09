# Use the official Bun image
FROM oven/bun:1-alpine as base
WORKDIR /usr/src/app

# Install dependencies into temp directory to cache them
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install production dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules and source files
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Release image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/src src
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/.env .

# Set environment variables
ENV NODE_ENV=production
USER bun
EXPOSE 5000/tcp
ENTRYPOINT [ "bun", "run", "src/server.ts" ]
