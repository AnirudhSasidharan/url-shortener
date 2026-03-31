# ── Stage 1: Build React app ───────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Build production bundle → outputs to /app/build
RUN npm run build

# ── Stage 2: Serve with Nginx ──────────────────────────────────────────────────
# Node is not needed in production, just serve static files
FROM nginx:alpine

# Copy built files into nginx serving directory
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
