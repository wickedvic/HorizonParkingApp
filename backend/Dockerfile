# Stage 1: Build
FROM node:24-alpine AS builder
# Install build tools for native modules like SQLite3
RUN apk add --no-cache python3 make g++ 
RUN npm install -g pnpm
WORKDIR /app

# Copy root lockfile and backend package definition
COPY pnpm-lock.yaml ./
COPY backend/package.json ./backend/

# Install dependencies for the backend
RUN pnpm install --filter ./backend

# Copy backend source code
COPY backend/ ./backend/

# Stage 2: Final Image
FROM node:24-alpine
WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app /app

# Ensure we are in the backend directory to run the server
WORKDIR /app/backend

# Create data directory for SQLite persistence
RUN mkdir -p data

EXPOSE 5001
CMD ["node", "server.js"]