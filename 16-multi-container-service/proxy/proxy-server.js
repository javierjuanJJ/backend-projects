const http      = require('http');
const httpProxy = require('http-proxy');

// ─── Configuración ────────────────────────────────────────────────────────────
const PORT   = process.env.PORT   || 3000;
const TARGET = process.env.TARGET || 'https://jsonplaceholder.typicode.com';
const TTL_MS = Number(process.env.TTL_MS) || 60_000;   // 60 s por defecto

// ─── Caché en memoria ─────────────────────────────────────────────────────────
// Cada entrada: { body: Buffer, headers: Object, savedAt: number }
const cache = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isValid  = entry => entry && (Date.now() - entry.savedAt) < TTL_MS;
const ttlLeft  = entry => Math.max(0, TTL_MS - (Date.now() - entry.savedAt));

function saveToCache(url, body, headers) {
  cache.set(url, { body, headers, savedAt: Date.now() });
  console.log(`[SAVED]   ${url}  (expira en ${TTL_MS / 1000}s)`);
}

function cacheStatus() {
  const entries = [];
  for (const [url, e] of cache.entries()) {
    const age = Date.now() - e.savedAt;
    entries.push({ url, ageMs: age, ttlLeftMs: ttlLeft(e), expired: ttlLeft(e) === 0 });
  }
  return { total: entries.length, ttlMs: TTL_MS, entries };
}

// ─── Instancia del proxy ──────────────────────────────────────────────────────
const proxy = httpProxy.createProxyServer({
  target:       TARGET,
  changeOrigin: true,
  secure:       false,
});

// ─── Servidor ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const { method, url } = req;

  // A) DELETE /cache  →  borrar TODO
  if (method === 'DELETE' && url === '/cache') {
    const total = cache.size;
    cache.clear();
    console.log(`[CLEAR]   ${total} entradas borradas`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Caché completo limpiado', entriesRemoved: total }));
  }

  // B) DELETE /cache/posts/1  →  borrar UNA entrada
  if (method === 'DELETE' && url.startsWith('/cache/')) {
    const targetPath = url.slice('/cache'.length);
    if (cache.has(targetPath)) {
      cache.delete(targetPath);
      console.log(`[DELETE]  ${targetPath}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: `Entrada eliminada: ${targetPath}` }));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: `Sin entrada para: ${targetPath}` }));
  }

  // C) GET /cache/status  →  inspeccionar caché
  if (method === 'GET' && url === '/cache/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(cacheStatus(), null, 2));
  }

  // D) POST /cache/purge-expired  →  limpiar solo caducadas
  if (method === 'POST' && url === '/cache/purge-expired') {
    let purged = 0;
    for (const [key, entry] of cache.entries()) {
      if (!isValid(entry)) { cache.delete(key); purged++; }
    }
    console.log(`[PURGE]   ${purged} entradas caducadas eliminadas`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: `${purged} entradas caducadas eliminadas` }));
  }

  // E) GET /health  →  health check para Docker
  if (method === 'GET' && url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', cacheSize: cache.size }));
  }

  // F) Lógica principal de caché → proxy
  const cached = cache.get(url);

  if (isValid(cached)) {
    const age = Date.now() - cached.savedAt;
    console.log(`[HIT]     ${url}  (edad: ${age}ms)`);
    res.writeHead(200, { ...cached.headers, 'X-Cache': 'HIT', 'X-Cache-Age': `${age}ms` });
    return res.end(cached.body);
  }

  if (cached) {
    cache.delete(url);
    console.log(`[EXPIRED] ${url}  → reenviando`);
  } else {
    console.log(`[MISS]    ${url}  → reenviando`);
  }

  proxy.web(req, res);
});

// ─── Interceptar respuesta real para guardar en caché ────────────────────────
proxy.on('proxyRes', (proxyRes, req) => {
  if (proxyRes.statusCode !== 200) return;
  const chunks = [];
  proxyRes.on('data', chunk => chunks.push(chunk));
  proxyRes.on('end', () => saveToCache(req.url, Buffer.concat(chunks), proxyRes.headers));
});

// ─── Errores del proxy ────────────────────────────────────────────────────────
proxy.on('error', (err, _req, res) => {
  console.error('[PROXY ERROR]', err.message);
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }));
});

// ─── Limpieza automática de entradas caducadas ────────────────────────────────
setInterval(() => {
  let purged = 0;
  for (const [key, entry] of cache.entries()) {
    if (!isValid(entry)) { cache.delete(key); purged++; }
  }
  if (purged > 0) console.log(`[AUTO-PURGE] ${purged} entradas caducadas`);
}, TTL_MS);

// ─── Arranque ─────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Caching Proxy → http://localhost:${PORT}`);
  console.log(`🎯 Target: ${TARGET}  |  ⏱ TTL: ${TTL_MS / 1000}s`);
  console.log('─'.repeat(52));
  console.log(`  GET    /posts/1               → proxiado con caché`);
  console.log(`  GET    /cache/status           → estado del caché`);
  console.log(`  DELETE /cache                  → borrar todo`);
  console.log(`  DELETE /cache/posts/1          → borrado selectivo`);
  console.log(`  POST   /cache/purge-expired    → limpiar caducadas`);
  console.log(`  GET    /health                 → health check`);
  console.log('─'.repeat(52) + '\n');
});
