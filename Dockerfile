# =============================================
# Luxor9 Ai Factory — Full Stack Dockerfile
# Multi-stage build: Frontend + Backend
# =============================================

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Copy frontend source
COPY index.html index.tsx index.css App.tsx types.ts vite.config.ts tsconfig.json vite-env.d.ts ./
COPY components/ components/
COPY services/ services/
COPY hooks/ hooks/
COPY utils/ utils/
COPY public/ public/
COPY design/ design/

# Build with esbuild
RUN npm install -g esbuild
RUN mkdir -p dist && \
    npx esbuild index.tsx \
    --bundle \
    --outfile=dist/index.js \
    --format=esm \
    --jsx=automatic \
    --loader:.tsx=tsx \
    --loader:.ts=ts \
    --loader:.css=css \
    --loader:.json=json \
    --minify \
    --sourcemap \
    --define:process.env.NODE_ENV='"production"' || true

# Copy static HTML
RUN cp index.html dist/index.html

# --- Stage 2: Backend Setup ---
FROM node:20-alpine AS backend

WORKDIR /app

# Copy backend files
COPY service/package.json ./service/
COPY service/server.js ./service/
COPY service/seed.js ./service/

# Install backend dependencies
RUN cd service && npm install --production

# Create data directories
RUN mkdir -p service/data/uploads

# Copy built frontend
COPY --from=frontend-builder /build/dist/ ./dist/

# Install static file server
RUN npm install -g serve

# Copy nginx config (for reverse proxy mode)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 8080 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start both services
CMD ["sh", "-c", "cd service && node server.js & serve -s /app/dist -l 3000 & wait"]
