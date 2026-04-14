/**
 * @file src/validation/validateOrigin.js
 * @description Validaciones relacionadas con el argumento --origin.
 */

'use strict';

const http = require('http');
const https = require('https');
const { ORIGIN_CHECK_TIMEOUT_MS } = require('../constants');

/** Protocolos HTTP aceptados como origen. */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Valida que el valor crudo de --origin sea una URL bien formada con
 * protocolo http o https.
 *
 * @param {string|undefined} rawUrl - Valor recibido desde la CLI.
 * @returns {string} La misma URL de entrada si supera la validación.
 * @throws {Error} Si la URL está vacía, tiene formato inválido o usa un protocolo no soportado.
 *
 * @example
 * validateOriginUrl('http://dummyjson.com')  // => 'http://dummyjson.com'
 * validateOriginUrl('ftp://example.com')     // throws Error
 * validateOriginUrl('')                      // throws Error
 */
function validateOriginUrl(rawUrl) {
  if (!rawUrl || rawUrl.trim() === '') {
    throw new Error('El argumento --origin es obligatorio.');
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      `La URL "${rawUrl}" no tiene un formato válido. Ejemplo: http://dummyjson.com`
    );
  }

  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
    throw new Error(
      `La URL debe usar protocolo http o https. Recibido: ${parsed.protocol}`
    );
  }

  return rawUrl;
}

/**
 * Comprueba de forma asíncrona que el servidor origen sea accesible
 * realizando una petición HEAD con un timeout definido en las constantes.
 *
 * Una respuesta con cualquier código HTTP (incluso 4xx) se considera éxito,
 * ya que confirma que el servidor existe y está activo.
 *
 * @param {string} url - URL del servidor origen ya validada por validateOriginUrl.
 * @returns {Promise<number>} Resuelve con el código de estado HTTP recibido.
 * @throws {Error} Si el servidor no existe, rechaza la conexión o no responde a tiempo.
 *
 * @example
 * const status = await checkOriginReachable('http://dummyjson.com');
 * console.log(status); // 200
 */
function checkOriginReachable(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      method: 'HEAD',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname || '/',
      timeout: ORIGIN_CHECK_TIMEOUT_MS,
    };

    const req = lib.request(options, (res) => {
      if (res.statusCode) {
        resolve(res.statusCode);
      } else {
        reject(new Error('El servidor no respondió correctamente.'));
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(
        new Error(
          `Timeout: El servidor "${url}" no respondió en ${ORIGIN_CHECK_TIMEOUT_MS / 1000} segundos.`
        )
      );
    });

    req.on('error', (err) => {
      if (err.code === 'ENOTFOUND') {
        reject(new Error(`No se encontró el servidor "${url}". Comprueba que la URL existe.`));
      } else if (err.code === 'ECONNREFUSED') {
        reject(new Error(`Conexión rechazada por "${url}". El servidor puede estar caído.`));
      } else {
        reject(new Error(`Error al contactar "${url}": ${err.message}`));
      }
    });

    req.end();
  });
}

module.exports = { validateOriginUrl, checkOriginReachable };
