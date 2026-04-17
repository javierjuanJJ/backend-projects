# ============================================================
# Dockerfile — Movie Reservation API
# Multi-stage: development | builder | production
# ============================================================

ARG NODE_VERSION=20

# ── Stage 1: Base con dependencias ───────────────────────────
FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@9

# ── Stage 2: Desarrollo ──────────────────────────────────────
FROM base AS development
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN pnpm prisma generate
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Stage 3: Builder (compila Next.js) ───────────────────────
FROM base AS builder
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# ── Stage 4: Producción (imagen mínima) ──────────────────────
FROM node:${NODE_VERSION}-alpine AS production
WORKDIR /app

RUN npm install -g pnpm@9
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copiar solo lo necesario de producción
COPY --from=builder /app/public ./public 2>/dev/null || true
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
