#!/usr/bin/env node

/**
 * @file index.js
 * @description Punto de entrada de la CLI del Caching Proxy.
 *
 * Este archivo únicamente orquesta el flujo de arranque:
 *   1. Parsea los argumentos de la CLI.
 *   2. Delega en el modo correcto (--clear-cache o iniciar proxy).
 *   3. Ejecuta las validaciones necesarias antes de arrancar.
 *
 * Toda la lógica real vive en los módulos de src/.
 */

'use strict';

const { parseArgs }              = require('./src/cli/args');
const { printHelpAndExit }       = require('./src/cli/help');
const { validatePort,
        checkPortAvailable }     = require('./src/validation/validatePort');
const { validateOriginUrl,
        checkOriginReachable }   = require('./src/validation/validateOrigin');
const { sendClearCacheRequest }  = require('./src/cache/cacheManager');
const { startServer }            = require('./src/proxy/server');

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(`\n✗ Error inesperado: ${err.message}\n`);
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Función principal asíncrona.
 * Decide el modo de ejecución según los argumentos recibidos y lo lleva a cabo.
 *
 * @returns {Promise<void>}
 */
async function main() {
  const args = parseArgs();

  // ── Sin argumentos: mostrar ayuda ────────────────────────────────────────
  if (!args.port && !args.origin && !args.clearCache) {
    printHelpAndExit();
  }

  // ── Modo: --clear-cache ───────────────────────────────────────────────────
  if (args.clearCache) {
    await runClearCacheMode(args);
    return;
  }

  // ── Modo: iniciar proxy ───────────────────────────────────────────────────
  await runProxyMode(args);
}

// ─────────────────────────────────────────────────────────────────────────────
// Modo: limpiar caché de un proxy en marcha
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida el puerto y envía la orden de limpieza al proxy local.
 *
 * @param {import('./src/cli/args').CliArgs} args
 * @returns {Promise<void>}
 */
async function runClearCacheMode(args) {
  const port = parsePortOrExit(args.port);

  console.log(
    args.url
      ? `  Eliminando del caché: ${args.url}`
      : `  Vaciando todo el caché del proxy en el puerto ${port}...`
  );

  // sendClearCacheRequest maneja su propio process.exit internamente.
  sendClearCacheRequest(port, args.url ?? null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Modo: iniciar el servidor proxy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida el puerto y el origen, y arranca el servidor proxy.
 *
 * @param {import('./src/cli/args').CliArgs} args
 * @returns {Promise<void>}
 */
async function runProxyMode(args) {
  // 1. Validar y comprobar disponibilidad del puerto
  const port = parsePortOrExit(args.port);

  try {
    await checkPortAvailable(port);
    console.log(`✓ Puerto ${port} disponible.`);
  } catch (err) {
    console.error(`\n✗ ${err.message}\n`);
    process.exit(1);
  }

  // 2. Validar formato de la URL del origen
  let origin;
  try {
    origin = validateOriginUrl(args.origin);
  } catch (err) {
    console.error(`\n✗ Error en --origin: ${err.message}\n`);
    process.exit(1);
  }

  // 3. Comprobar que el origen es accesible
  console.log(`  Comprobando acceso a "${origin}"...`);
  try {
    const status = await checkOriginReachable(origin);
    console.log(`✓ Servidor accesible (HTTP ${status}).`);
  } catch (err) {
    console.error(`\n✗ ${err.message}\n`);
    process.exit(1);
  }

  // 4. Todo correcto: arrancar el proxy
  startServer(port, origin);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida el argumento --port y termina el proceso con un mensaje de error si falla.
 *
 * @param {string|undefined} rawPort
 * @returns {number} Puerto validado.
 */
function parsePortOrExit(rawPort) {
  try {
    return validatePort(rawPort);
  } catch (err) {
    console.error(`\n✗ Error en --port: ${err.message}\n`);
    process.exit(1);
  }
}
