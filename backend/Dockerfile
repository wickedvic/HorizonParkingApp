FROM node:24-alpine AS builder
RUN npm install -g pnpm@latest

# Set pnpm home and path for Alpine compatibility
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable pnpm

WORKDIR /app

# Copy root lockfile AND backend package.json
COPY pnpm-lock.yaml ./
COPY backend/package.json ./backend/

# If exit code 1 persists, remove --frozen-lockfile temporarily to debug
RUN pnpm install --filter ./backend

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