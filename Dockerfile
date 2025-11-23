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
FROM gcr.io/distroless/cc-debian12:nonroot AS runner
WORKDIR /app

# Copy the built executable and @img folder so the executable can find sharp native modules
COPY --from=build --chmod=755 /app/dist/exe /app/exe
COPY --from=build /app/node_modules/@img /app/node_modules/@img

# Run the executable
CMD ["/app/exe"]