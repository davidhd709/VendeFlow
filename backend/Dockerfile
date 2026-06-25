# ── Etapa 1: instalar y compilar dependencias ──────────────────────────────
FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Herramientas para compilar módulos nativos (bcrypt, lmdb, etc.)
RUN apk add --no-cache python3 make g++ && corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json  ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild @prisma/engines bcrypt esbuild lmdb msgpackr-extract @parcel/watcher

# ── Etapa 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder

COPY backend ./backend

RUN pnpm --filter @salesflow/backend exec prisma generate && \
    pnpm --filter @salesflow/backend build

# ── Etapa 3: imagen de producción (sin herramientas de compilación) ─────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copiar node_modules completo del workspace (pnpm usa symlinks internos)
COPY --from=builder /app/node_modules         ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist         ./backend/dist
COPY --from=builder /app/backend/prisma       ./backend/prisma
COPY package.json                             ./
COPY backend/package.json                    ./backend/

EXPOSE 3000
CMD ["node", "backend/dist/main.js"]
