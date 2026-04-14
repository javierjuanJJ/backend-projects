/**
 * @file src/proxy/server.js
 * @description Crea y arranca el servidor HTTP proxy con caché.
 *
 * El servidor gestiona tres tipos de peticiones en orden de prioridad:
 *   1. Peticiones internas de gestión del caché (vía CLI --clear-cache).
 *   2. Peticiones cuya ruta está en caché → respuesta inmediata (HIT).
 *   3. Resto de peticiones → reenvío al servidor destino (MISS).
 */

'use strict';

const http = require('http');
const cache = require('../cache/cacheStore');
const { isCacheManagementRequest, handleCacheManagement } = require('../cache/cacheManager');
const { forwardRequest } = require('./forwardRequest');
const { HEADER_X_CACHE, HEADER_X_PROXY, PROXY_IDENTIFIER } = require('../constants');

/**
 * Crea el servidor HTTP y comienza a escuchar en el puerto indicado.
 *
 * @param {number} port   - Puerto local donde escuchará el proxy.
 * @param {string} origin - URL base del servidor destino.
 * @returns {http.Server} La instancia del servidor HTTP creada.
 *
 * @example
 * const server = startServer(3000, 'http://dummyjson.com');
 */
function startServer(port, origin) {
  const server = http.createServer((req, res) => {
    // ── 1. Gestión interna del caché (peticiones desde --clear-cache) ──────
    // Interceptadas antes de llegar al origen. No se reenvían nunca.
    if (isCacheManagementRequest(req)) {
      return handleCacheManagement(req, res);
    }

    // ── 2. Caché HIT: la ruta ya está almacenada ────────────────────────────
    if (cache.has(req.url)) {
      console.log(`  [HIT]  ${req.url}`);
      const { body, headers } = cache.get(req.url);

      res.writeHead(200, {
        ...headers,
        [HEADER_X_CACHE]: 'HIT',
        [HEADER_X_PROXY]: PROXY_IDENTIFIER,
      });

      return res.end(body);
    }

    // ── 3. Caché MISS: reenviar al servidor destino ─────────────────────────
    console.log(`  [MISS] ${req.url} → reenviando a ${origin}`);
    forwardRequest(req, res, origin);
  });

  server.listen(port, () => {
    printBanner(port, origin);
  });

  return server;
}

/**
 * Imprime el banner de inicio del proxy en la consola.
 *
 * @param {number} port   - Puerto donde está escuchando el proxy.
 * @param {string} origin - URL del servidor destino configurado.
 * @returns {void}
 */
function printBanner(port, origin) {
  const pad = (n) => ' '.repeat(Math.max(0, n));

  console.log('');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│              CACHING PROXY - Activo ✓               │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log(`│  Puerto local : http://localhost:${port}${pad(21 - String(port).length)}│`);
  console.log(`│  Destino      : ${origin}${pad(36 - origin.length)}│`);
  console.log('├─────────────────────────────────────────────────────┤');
  console.log('│  Para limpiar el caché desde otra terminal:         │');
  console.log(`│  node index.js --clear-cache --port ${port}${pad(17 - String(port).length)}│`);
  console.log('└─────────────────────────────────────────────────────┘');
  console.log('');
  console.log('  Esperando peticiones...');
  console.log('');
}

module.exports = { startServer };
