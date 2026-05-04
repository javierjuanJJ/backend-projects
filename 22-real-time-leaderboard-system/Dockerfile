# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install ALL deps (including devDependencies for prisma generate)
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN pnpm prisma generate

# Copy source
COPY . .

# ─── Stage 2: Runner (production) ────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 appuser

WORKDIR /app

# Copy manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod \
 && pnpm prisma generate

# Copy built app from builder
COPY --from=builder /app/src ./src
COPY --from=builder /app/app.js ./app.js
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/config.js ./config.js

# Set correct ownership
RUN chown -R appuser:nodejs /app

USER appuser

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

# Health check (endpoint must return 200)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Run migrations then start server
CMD ["sh", "-c", "pnpm prisma migrate deploy && node server.js"]
