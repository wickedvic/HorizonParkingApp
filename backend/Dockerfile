# Stage 1: Build
FROM node:24-alpine AS builder
# Install build tools needed for native modules like SQLite3
RUN apk add --no-cache python3 make g++ 

RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-lock.yaml ./
COPY backend/package.json ./backend/

RUN pnpm install --filter ./backend

# Stage 2: Final Image
FROM node:24-alpine
WORKDIR /app

# Copy EVERYTHING from builder to ensure native modules are kept
COPY --from=builder /app /app

# Create a folder for the SQLite database persistence
RUN mkdir -p /app/backend/data

WORKDIR /app/backend
EXPOSE 5001

CMD ["node", "server.js"]