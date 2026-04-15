# ============================================================
# Workout Tracker — Dockerfile Multi-stage
# ============================================================

# ── Stage 1: Base ────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# ── Stage 2: Dependencies ─────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# ── Stage 3: Development ──────────────────────────────────
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Stage 4: Builder ──────────────────────────────────────
FROM base AS builder
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# ── Stage 5: Production ───────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production

# Solo copiar lo necesario para producción
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
