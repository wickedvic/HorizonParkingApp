FROM node:24-alpine
RUN npm install -g pnpm
WORKDIR /app

# Copy root lockfile and backend package definition
COPY pnpm-lock.yaml ./
COPY backend/package.json ./backend/

# Install dependencies - no native build tools required for MySQL
RUN pnpm install --filter ./backend

# Copy backend source code
COPY backend/ ./backend/

# Move into the backend directory
WORKDIR /app/backend

EXPOSE 5001
CMD ["node", "server.js"]