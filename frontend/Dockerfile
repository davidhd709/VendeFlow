# ── Etapa 1: instalar dependencias ─────────────────────────────────────────
FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json  ./backend/
COPY frontend/package.json ./frontend/

# pnpm 11 bloquea build scripts por defecto; instalamos sin scripts
# y reconstruimos solo esbuild que Angular necesita
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild esbuild

# ── Etapa 2: build Angular ──────────────────────────────────────────────────
FROM deps AS builder

COPY frontend ./frontend

RUN pnpm --filter @salesflow/frontend build

# ── Etapa 3: imagen Nginx con archivos estáticos ────────────────────────────
FROM nginx:1.27-alpine AS runner

# Eliminar config default de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar config de nginx (HTTP por defecto; ver nginx.ssl.conf para HTTPS)
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados de Angular
# Angular 19 los genera en dist/frontend/browser
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80
