# Build stage
FROM oven/bun:latest AS build
WORKDIR /app

# Installing dependencies
COPY package.json package.json
COPY bun.lock bun.lock
RUN bun install --production

# Building the app
COPY . .
RUN bun run build

# Runner stage
FROM oven/bun:alpine AS runner
WORKDIR /app

# Copy the built executable and node_modules so the executable can find sharp native modules
COPY --from=build /app/dist /app
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules

# Run the executable
CMD ["bun", "run", "/app/index.js"]