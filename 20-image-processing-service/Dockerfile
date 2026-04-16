# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

# sharp requires these native build tools
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Builder (generates Prisma client + Next.js build)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm prisma generate

COPY . .
RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Production runner
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

LABEL org.opencontainers.image.title="Image Processing API" \
      org.opencontainers.image.description="Next.js + Express image processing service" \
      org.opencontainers.image.source="https://github.com/YOUR_ORG/image-processing-api"

# Runtime dependencies for sharp / libvips
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    curl \
  && addgroup --system --gid 1001 nodejs \
  && adduser  --system --uid 1001 nextjs

WORKDIR /app

# Copy built artefacts
COPY --from=builder --chown=nextjs:nodejs /app/.next          ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules   ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma         ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src            ./src
COPY --from=builder --chown=nextjs:nodejs /app/server.js      ./server.js
COPY --from=builder --chown=nextjs:nodejs /app/package.json   ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./next.config.js 2>/dev/null || true

# Create directories for uploads and cache with correct ownership
RUN mkdir -p /app/uploads /app/cache \
  && chown -R nextjs:nodejs /app/uploads /app/cache

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
