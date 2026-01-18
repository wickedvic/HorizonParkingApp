# Stage 1: Install Dependencies
FROM node:24-alpine AS builder
RUN npm install -g pnpm

WORKDIR /app

# Copy the root lockfile and backend package definition
COPY pnpm-lock.yaml ./
COPY backend/package.json ./backend/

# Install only backend dependencies
RUN pnpm install --filter ./backend --frozen-lockfile

# Stage 2: Final Image
FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Create a folder for the SQLite database persistence
RUN mkdir -p /app/backend/data

WORKDIR /app/backend
EXPOSE 5001

CMD ["node", "server.js"]