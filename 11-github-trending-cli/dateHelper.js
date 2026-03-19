/**
 * @file dateHelper.js
 * @description Utilidades de fecha para calcular el rango temporal
 *              que se usará como filtro en la consulta a la API de GitHub.
 */

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

/**
 * Calcula la fecha de inicio del período indicado a partir de hoy.
 * Devuelve la fecha en formato ISO YYYY-MM-DD, que es el formato
 * que acepta el filtro `created:>` de la GitHub Search API.
 *
 * @param {'day'|'week'|'month'|'year'} duration - Período hacia atrás desde hoy
 * @returns {string} Fecha en formato YYYY-MM-DD
 *
 * @example
 * // Si hoy es 2026-03-19:
 * getStartDate('week')  // → '2026-03-12'
 * getStartDate('month') // → '2026-02-19'
 */
function getStartDate(duration) {
    const date = new Date();

    switch (duration) {
        case 'day':   date.setDate(date.getDate() - 1);          break;
        case 'week':  date.setDate(date.getDate() - 7);          break;
        case 'month': date.setMonth(date.getMonth() - 1);        break;
        case 'year':  date.setFullYear(date.getFullYear() - 1);  break;
    }

    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Construye el string de query para la Search API de GitHub,
 * filtrando repositorios creados a partir de la fecha calculada.
 *
 * @param {string} duration - Período de tiempo validado
 * @returns {string} Query string listo para usar en el parámetro `q`
 *
 * @example
 * buildSearchQuery('week') // → 'created:>2026-03-12'
 */
function buildSearchQuery(duration) {
    const since = getStartDate(duration);
    return `created:>${since}`;
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = { getStartDate, buildSearchQuery };
