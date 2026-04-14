/**
 * @file src/cache/cacheStore.js
 * @description Almacén de caché en memoria basado en un Map.
 *
 * Encapsula la estructura de datos del caché para que el resto del código
 * no tenga que conocer la implementación interna. Si en el futuro se quisiera
 * cambiar a Redis o a disco, solo habría que modificar este archivo.
 */

'use strict';

/**
 * @typedef {Object} CacheEntry
 * @property {Buffer} body    - Cuerpo de la respuesta HTTP almacenada.
 * @property {Object} headers - Cabeceras HTTP originales del servidor destino.
 */

/**
 * Almacén de caché en memoria.
 * La clave es la ruta de la petición (ej: "/products/1").
 * El valor es un objeto { body, headers }.
 *
 * @type {Map<string, CacheEntry>}
 */
const store = new Map();

/**
 * Devuelve la entrada cacheada para una ruta dada, o undefined si no existe.
 *
 * @param {string} url - Ruta de la petición HTTP (ej: "/products/1").
 * @returns {CacheEntry|undefined}
 */
function get(url) {
  return store.get(url);
}

/**
 * Almacena una respuesta en caché.
 *
 * @param {string}      url     - Ruta de la petición HTTP.
 * @param {CacheEntry}  entry   - Objeto con body y headers a guardar.
 * @returns {void}
 */
function set(url, entry) {
  store.set(url, entry);
}

/**
 * Indica si existe una entrada cacheada para la ruta dada.
 *
 * @param {string} url - Ruta de la petición HTTP.
 * @returns {boolean}
 */
function has(url) {
  return store.has(url);
}

/**
 * Elimina la entrada cacheada de una ruta concreta.
 *
 * @param {string} url - Ruta de la petición HTTP.
 * @returns {boolean} true si existía y fue eliminada, false si no existía.
 */
function remove(url) {
  return store.delete(url);
}

/**
 * Vacía completamente el caché.
 *
 * @returns {number} Número de entradas que había antes de limpiar.
 */
function clear() {
  const size = store.size;
  store.clear();
  return size;
}

/**
 * Devuelve el número de entradas actualmente en caché.
 *
 * @returns {number}
 */
function size() {
  return store.size;
}

/**
 * Devuelve un array con todas las rutas actualmente cacheadas.
 *
 * @returns {string[]}
 */
function keys() {
  return [...store.keys()];
}

module.exports = { get, set, has, remove, clear, size, keys };
