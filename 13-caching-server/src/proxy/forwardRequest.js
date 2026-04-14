/**
 * @file src/proxy/forwardRequest.js
 * @description Reenvía una petición HTTP/HTTPS al servidor destino,
 * guarda la respuesta en caché si procede y escribe la respuesta al cliente.
 */

'use strict';

const http = require('http');
const https = require('https');
const cache = require('../cache/cacheStore');
const {
  PROXY_REQUEST_TIMEOUT_MS,
  HEADER_X_CACHE,
  HEADER_X_PROXY,
  PROXY_IDENTIFIER,
} = require('../constants');

/**
 * Reenvía la petición entrante al servidor destino (origin).
 *
 * Flujo:
 *   1. Construye las opciones de la petición saliente.
 *   2. Acumula los chunks de la respuesta del origen.
 *   3. Si la respuesta es 200 OK y el método es GET, guarda en caché.
 *   4. Escribe la respuesta al cliente original añadiendo las cabeceras X-Cache y X-Proxy.
 *
 * @param {http.IncomingMessage} req    - Petición original del cliente.
 * @param {http.ServerResponse}  res    - Respuesta que se enviará al cliente.
 * @param {string}               origin - URL base del servidor destino (ej: "http://dummyjson.com").
 * @returns {void}
 */
function forwardRequest(req, res, origin) {
  const parsedOrigin = new URL(origin);
  const lib = parsedOrigin.protocol === 'https:' ? https : http;

  const proxyOptions = {
    method: req.method,
    hostname: parsedOrigin.hostname,
    port: parsedOrigin.port || (parsedOrigin.protocol === 'https:' ? 443 : 80),
    path: req.url,
    headers: {
      ...req.headers,
      // Sustituimos el host para que el destino reciba el correcto.
      host: parsedOrigin.host,
    },
    timeout: PROXY_REQUEST_TIMEOUT_MS,
  };

  const proxyReq = lib.request(proxyOptions, (proxyRes) => {
    const chunks = [];

    proxyRes.on('data', (chunk) => chunks.push(chunk));

    proxyRes.on('end', () => {
      const body = Buffer.concat(chunks);

      // Solo cacheamos peticiones GET con respuesta 200 OK.
      if (proxyRes.statusCode === 200 && req.method === 'GET') {
        cache.set(req.url, { body, headers: proxyRes.headers });
        console.log(`  [SAVED] ${req.url} (${body.length} bytes)`);
      }

      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        [HEADER_X_CACHE]: 'MISS',
        [HEADER_X_PROXY]: PROXY_IDENTIFIER,
      });

      res.end(body);
    });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.writeHead(504, { 'Content-Type': 'text/plain' });
    res.end('Gateway Timeout: el servidor destino no respondió.');
  });

  proxyReq.on('error', (err) => {
    console.error(`  [ERROR] ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end(`Bad Gateway: ${err.message}`);
  });

  // Pipe del cuerpo de la request original (necesario para POST, PUT, PATCH, etc.)
  req.pipe(proxyReq);
}

module.exports = { forwardRequest };
