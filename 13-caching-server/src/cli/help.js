/**
 * @file src/cli/help.js
 * @description Muestra el mensaje de ayuda y termina el proceso.
 */

'use strict';

/**
 * Imprime el mensaje de uso por stdout y termina el proceso con código 0.
 * Se llama cuando el usuario ejecuta el comando sin argumentos.
 *
 * @returns {never}
 */
function printHelpAndExit() {
  console.log(`
Uso:
  node index.js --port <número> --origin <url>
  node index.js --clear-cache --port <número> [--url <ruta>]

Opciones:
  --port         Puerto local entre 1 y 4000 (debe estar libre)
  --origin       URL del servidor destino (debe ser accesible)
  --clear-cache  Vacía el caché del proxy que escucha en --port
  --url          (Opcional junto a --clear-cache) Borra solo esa ruta del caché

Ejemplos:
  node index.js --port 3000 --origin http://dummyjson.com
  node index.js --clear-cache --port 3000
  node index.js --clear-cache --port 3000 --url /products/1
  `);

  process.exit(0);
}

module.exports = { printHelpAndExit };
