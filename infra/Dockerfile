# ─── Single Service: Bun (API + Static + Auth Proxy + WS) ─

FROM oven/bun:1 AS builder
WORKDIR /app

# 1) Package manifest'leri (layer caching)
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
COPY packages/types/package.json ./packages/types/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# 2) Dependencies (dev dahil — vite build için)
RUN bun install --frozen-lockfile

# 3) Kaynak kod
COPY apps ./apps
COPY packages ./packages
COPY convex ./convex

# 4) Vite build → static dosyalar
RUN cd apps/web && bun run build

# 5) Static dosyaları API'nin yanına kopyala
RUN cp -r apps/web/dist public

# ─── Production Stage ─────────────────────────────────────
FROM oven/bun:1-slim
WORKDIR /app

# Monorepo yapısını koru (convex/_generated relative import'ları için)
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bunfig.toml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/convex ./convex
COPY --from=builder /app/public ./public

EXPOSE 3001
CMD ["bun", "run", "apps/api/src/index.ts"]
