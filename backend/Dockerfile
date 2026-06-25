# ── Etapa 1: instalar dependencias ─────────────────────────────────────────
FROM node:22-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json  ./backend/
COPY frontend/package.json ./frontend/

# pnpm 11: instalar sin scripts y reconstruir solo los módulos nativos
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm rebuild @prisma/engines bcrypt esbuild lmdb msgpackr-extract @parcel/watcher

# ── Etapa 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder

COPY backend ./backend

RUN pnpm --filter @salesflow/backend exec prisma generate
RUN pnpm --filter @salesflow/backend build

# pnpm deploy crea node_modules plano sin symlinks — ideal para producción
RUN pnpm --filter @salesflow/backend deploy --prod /app/prod-deploy && \
    cp -r /app/node_modules/.pnpm /app/prod-deploy/node_modules/.pnpm 2>/dev/null || true

# ── Etapa 3: imagen de producción ──────────────────────────────────────────
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/prod-deploy/node_modules  ./node_modules
COPY --from=builder /app/backend/dist              ./backend/dist
COPY --from=builder /app/backend/prisma            ./backend/prisma
COPY --from=builder /app/prod-deploy/package.json  ./

EXPOSE 3000
CMD ["node", "backend/dist/main.js"]
