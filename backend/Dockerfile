# ── Etapa 1: instalar dependencias ─────────────────────────────────────────
FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copiar manifests del monorepo (cambios aquí invalidan la capa de deps)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json  ./backend/
COPY frontend/package.json ./frontend/

# pnpm 11 bloquea build scripts por defecto; instalamos sin scripts
# y reconstruimos solo los módulos nativos necesarios
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild @prisma/engines bcrypt esbuild lmdb msgpackr-extract @parcel/watcher

# ── Etapa 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder

COPY backend ./backend

# Generar cliente Prisma y compilar TypeScript
RUN pnpm --filter @salesflow/backend exec prisma generate
RUN pnpm --filter @salesflow/backend build

# ── Etapa 3: imagen de producción ──────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# pnpm workspace: deps en node_modules raíz + backend/node_modules (symlinks)
COPY --from=builder /app/node_modules         ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist         ./backend/dist
COPY --from=builder /app/backend/prisma       ./backend/prisma
COPY package.json                             ./
COPY backend/package.json                    ./backend/

EXPOSE 3000

# Prisma migrate deploy se ejecuta desde el pipeline (ver deploy.yml)
CMD ["node", "backend/dist/main.js"]
