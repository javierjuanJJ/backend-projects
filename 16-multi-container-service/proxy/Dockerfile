# ── Etapa 1: instalar dependencias de producción ──────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# ── Etapa 2: imagen final ──────────────────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Usuario sin privilegios root
RUN addgroup -S proxygroup && adduser -S proxyuser -G proxygroup

COPY --from=deps /app/node_modules ./node_modules
COPY proxy-server.js ./

USER proxyuser

# Variables de entorno con valores por defecto
ENV PORT=3000 \
    TARGET=https://jsonplaceholder.typicode.com \
    TTL_MS=60000 \
    NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "proxy-server.js"]
