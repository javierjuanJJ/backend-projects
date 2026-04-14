/**
 * @file src/cache/cacheManager.js
 * @description Lógica de gestión del caché:
 *   - Handler HTTP interno que el servidor usa para procesar peticiones de limpieza.
 *   - Cliente que el proceso --clear-cache usa para enviar esas peticiones.
 */

'use strict';

const http = require('http');
const cache = require('./cacheStore');
const { INTERNAL_CACHE_PREFIX, CLEAR_CACHE_TIMEOUT_MS } = require('../constants');

// ── Handler interno (usado dentro del servidor) ───────────────────────────────

/**
 * Determina si una petición entrante es una orden de limpieza de caché.
 * Solo se reconocen peticiones POST a la ruta interna definida en las constantes.
 *
 * @param {http.IncomingMessage} req - Petición HTTP entrante.
 * @returns {boolean}
 */
function isCacheManagementRequest(req) {
  return req.method === 'POST' && req.url.startsWith(INTERNAL_CACHE_PREFIX);
}

/**
 * Procesa una petición interna de limpieza de caché y escribe la respuesta.
 *
 * Comportamiento:
 *   - Sin query string → vacía todo el caché.
 *   - Con ?url=<ruta>  → borra solo esa ruta concreta.
 *
 * Esta función se llama desde el servidor proxy antes de reenviar la petición
 * al origen, por lo que nunca llega al servidor destino.
 *
 * @param {http.IncomingMessage} req - Petición HTTP entrante.
 * @param {http.ServerResponse}  res - Respuesta HTTP a escribir.
 * @returns {void}
 */
function handleCacheManagement(req, res) {
  const match = req.url.match(/\?url=(.+)$/);

  if (match) {
    // Borrar una única entrada
    const target = decodeURIComponent(match[1]);

    if (cache.has(target)) {
      cache.remove(target);
      console.log(`  [CLEAR] Entrada eliminada: ${target}`);
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`✓ Entrada eliminada del caché: ${target}`);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`✗ URL no encontrada en caché: ${target}`);
    }
  } else {
    // Borrar todo el caché
    const deleted = cache.clear();
    console.log(`  [CLEAR] Caché vaciado (${deleted} entrada(s) eliminadas)`);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`✓ Caché limpiado. Se eliminaron ${deleted} entrada(s).`);
  }
}

// ── Cliente CLI (usado por el proceso --clear-cache) ─────────────────────────

/**
 * Envía una petición POST al proxy local para limpiar su caché.
 * Se ejecuta como un proceso independiente (el que recibe --clear-cache).
 *
 * @param {number}          port    - Puerto donde escucha el proxy.
 * @param {string|null}     urlPath - Ruta concreta a borrar, o null para borrar todo.
 * @returns {void} Termina el proceso con exit(0) si tiene éxito o exit(1) si falla.
 *
 * @example
 * sendClearCacheRequest(3000, null);          // borra todo
 * sendClearCacheRequest(3000, '/products/1'); // borra solo /products/1
 */
function sendClearCacheRequest(port, urlPath) {
  const reqPath = urlPath
    ? `${INTERNAL_CACHE_PREFIX}?url=${encodeURIComponent(urlPath)}`
    : INTERNAL_CACHE_PREFIX;

  const options = {
    hostname: '127.0.0.1',
    port,
    path: reqPath,
    method: 'POST',
    timeout: CLEAR_CACHE_TIMEOUT_MS,
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log(`\n${body.trim()}\n`);
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  });

  req.on('timeout', () => {
    req.destroy();
    console.error(
      `\n✗ Timeout: no hay ningún proxy escuchando en el puerto ${port}.\n`
    );
    process.exit(1);
  });

  req.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
      console.error(`\n✗ No hay ningún proxy en marcha en el puerto ${port}.\n`);
    } else {
      console.error(`\n✗ Error: ${err.message}\n`);
    }
    process.exit(1);
  });

  req.end();
}

module.exports = {
  isCacheManagementRequest,
  handleCacheManagement,
  sendClearCacheRequest,
};
