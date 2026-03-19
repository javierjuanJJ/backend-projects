/**
 * @file constants.js
 * @description Constantes globales del CLI de GitHub Trending.
 *              Centraliza todos los valores fijos para facilitar
 *              su mantenimiento y evitar magic strings dispersos.
 */

// ─────────────────────────────────────────────
//  Parámetros CLI
// ─────────────────────────────────────────────

/** Valores aceptados para --duration */
const VALID_DURATIONS = ['day', 'week', 'month', 'year'];

/** Valor por defecto de --duration cuando no se especifica */
const DEFAULT_DURATION = 'week';

/** Valor por defecto de --limit cuando no se especifica */
const DEFAULT_LIMIT = 10;

/** Máximo número de repositorios que puede pedir la API en una sola página */
const MAX_LIMIT = 100;

// ─────────────────────────────────────────────
//  GitHub API
// ─────────────────────────────────────────────

/** URL base del endpoint de búsqueda de repositorios */
const GITHUB_SEARCH_URL = 'https://api.github.com/search/repositories';

/** Versión de la API de GitHub que se desea usar */
const GITHUB_API_VERSION = '2022-11-28';

/** Cabecera Accept recomendada por la documentación oficial */
const GITHUB_ACCEPT_HEADER = 'application/vnd.github+json';

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = {
    VALID_DURATIONS,
    DEFAULT_DURATION,
    DEFAULT_LIMIT,
    MAX_LIMIT,
    GITHUB_SEARCH_URL,
    GITHUB_API_VERSION,
    GITHUB_ACCEPT_HEADER,
};
