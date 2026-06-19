# ── Stage 1: Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files trước để cache node_modules
COPY package.json package-lock.json ./
RUN npm ci

# Copy toàn bộ source
COPY . .

# Build production
RUN npm run build

# ── Stage 2: Serve với Nginx ─────────────────────────────────────────
FROM nginx:alpine

# Copy build output vào nginx html folder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config để handle React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
