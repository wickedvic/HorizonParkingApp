# Stage 1: Build Vite
FROM node:24-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# 1. Copy workspace-wide files first
COPY pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY package.json ./ 

# 2. Copy the frontend definition
COPY frontend/package.json ./frontend/

# 3. Install dependencies for the frontend specifically
# This will now correctly find material-react-table
RUN pnpm install --filter ./frontend

# 4. Copy frontend source
COPY frontend/ ./frontend/

# 5. Move into frontend to build
WORKDIR /app/frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]