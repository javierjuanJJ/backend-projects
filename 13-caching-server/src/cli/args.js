/**
 * @file src/cli/args.js
 * @description Parseo de los argumentos recibidos por línea de comandos.
 *
 * Lee process.argv y devuelve un objeto plano con las opciones reconocidas.
 * No valida los valores; esa responsabilidad recae en el módulo de validación.
 */

'use strict';

/**
 * @typedef {Object} CliArgs
 * @property {string|undefined}  port        - Valor crudo del argumento --port.
 * @property {string|undefined}  origin      - Valor crudo del argumento --origin.
 * @property {boolean}           clearCache  - true si se pasó el flag --clear-cache.
 * @property {string|undefined}  url         - Valor crudo del argumento --url.
 */

/**
 * Parsea los argumentos de la línea de comandos.
 *
 * Argumentos reconocidos:
 *   --port   <número>   Puerto local del proxy.
 *   --origin <url>      URL del servidor destino.
 *   --clear-cache       Activa el modo limpieza de caché.
 *   --url    <ruta>     (Opcional junto a --clear-cache) Ruta concreta a borrar.
 *
 * @returns {CliArgs} Objeto con las opciones parseadas.
 *
 * @example
 * // node index.js --port 3000 --origin http://dummyjson.com
 * parseArgs() // => { port: '3000', origin: 'http://dummyjson.com', clearCache: false }
 *
 * @example
 * // node index.js --clear-cache --port 3000 --url /products/1
 * parseArgs() // => { port: '3000', clearCache: true, url: '/products/1' }
 */
function parseArgs() {
  const argv = process.argv.slice(2);

  /** @type {CliArgs} */
  const result = {
    port: undefined,
    origin: undefined,
    clearCache: false,
    url: undefined,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--port' && argv[i + 1]) {
      result.port = argv[i + 1];
      i++;
    } else if (arg === '--origin' && argv[i + 1]) {
      result.origin = argv[i + 1];
      i++;
    } else if (arg === '--clear-cache') {
      result.clearCache = true;
    } else if (arg === '--url' && argv[i + 1]) {
      result.url = argv[i + 1];
      i++;
    }
  }

  return result;
}

module.exports = { parseArgs };
