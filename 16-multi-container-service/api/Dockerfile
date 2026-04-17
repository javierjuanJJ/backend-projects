# ── Etapa 1: dependencias de producción ──────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Etapa 2: imagen final ─────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

RUN addgroup -S apigroup && adduser -S apiuser -G apigroup

COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

USER apiuser

ENV NODE_ENV=production \
    PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/app.js"]
