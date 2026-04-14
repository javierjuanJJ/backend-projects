/**
 * @file constants.js
 * @description Constantes globales del proyecto.
 *
 * Centralizar aquí todos los valores "mágicos" permite cambiarlos
 * en un único sitio sin tener que buscarlos por el código.
 */

'use strict';

// ── Límites del puerto ────────────────────────────────────────────────────────

/** Puerto mínimo aceptado por la CLI. */
const PORT_MIN = 1;

/** Puerto máximo aceptado por la CLI. */
const PORT_MAX = 4000;

// ── Timeouts (en milisegundos) ────────────────────────────────────────────────

/** Tiempo máximo para comprobar si el origen responde al arrancar. */
const ORIGIN_CHECK_TIMEOUT_MS = 5_000;

/** Tiempo máximo para que el servidor destino responda a una petición proxy. */
const PROXY_REQUEST_TIMEOUT_MS = 10_000;

/** Tiempo máximo para que el proxy local responda a un --clear-cache. */
const CLEAR_CACHE_TIMEOUT_MS = 3_000;

// ── Ruta interna de gestión de caché ─────────────────────────────────────────

/**
 * Prefijo de ruta reservado para comunicación interna entre procesos CLI.
 * Las peticiones a esta ruta NUNCA se reenvían al servidor destino.
 * Solo son accesibles desde localhost mediante el comando --clear-cache.
 */
const INTERNAL_CACHE_PREFIX = '/__cache__/clear';

// ── Cabeceras HTTP ────────────────────────────────────────────────────────────

/** Nombre de la cabecera que indica si la respuesta viene del caché. */
const HEADER_X_CACHE = 'X-Cache';

/** Nombre de la cabecera de identificación del proxy. */
const HEADER_X_PROXY = 'X-Proxy';

/** Valor de X-Proxy en todas las respuestas. */
const PROXY_IDENTIFIER = 'caching-proxy-cli';

module.exports = {
  PORT_MIN,
  PORT_MAX,
  ORIGIN_CHECK_TIMEOUT_MS,
  PROXY_REQUEST_TIMEOUT_MS,
  CLEAR_CACHE_TIMEOUT_MS,
  INTERNAL_CACHE_PREFIX,
  HEADER_X_CACHE,
  HEADER_X_PROXY,
  PROXY_IDENTIFIER,
};
