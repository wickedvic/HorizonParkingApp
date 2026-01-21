# Stage 1: Build Vite
FROM node:24-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy root lockfile and frontend package definition
COPY pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/

RUN pnpm install --filter ./frontend

# Copy frontend source and build
COPY frontend/ ./frontend/
WORKDIR /app/frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

# Copy built files from stage 1
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# IMPORTANT: Copy your custom Nginx config to the correct location
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]