/**
 * @file githubClient.js
 * @description Cliente para la GitHub Search API.
 *              Encapsula la construcción de la URL, las cabeceras
 *              y el manejo de errores HTTP.
 *              Lanza NetworkError o ApiError según el tipo de fallo.
 */

const { NetworkError, ApiError }                    = require('./errors');
const { GITHUB_SEARCH_URL,
        GITHUB_API_VERSION,
        GITHUB_ACCEPT_HEADER }                      = require('./constants');
const { buildSearchQuery }                          = require('./dateHelper');

// ─────────────────────────────────────────────
//  Cliente
// ─────────────────────────────────────────────

/**
 * Consulta la GitHub Search API y devuelve los repositorios
 * más destacados dentro del período indicado.
 *
 * @param {string} duration - Período de tiempo validado (day | week | month | year)
 * @param {number} limit    - Número máximo de repositorios a devolver
 * @returns {Promise<object[]>} Array de repositorios (items de la respuesta)
 * @throws {NetworkError} Si la petición no llega al servidor (sin red, timeout…)
 * @throws {ApiError}     Si el servidor responde con un código HTTP de error
 */
async function fetchTrendingRepos(duration, limit) {
    const query  = buildSearchQuery(duration);
    const params = new URLSearchParams({
        q:        query,
        sort:     'stars',
        order:    'desc',
        per_page: String(limit),
        page:     '1',
    });

    const url = `${GITHUB_SEARCH_URL}?${params.toString()}`;

    // ── Petición HTTP ──────────────────────────
    let response;
    try {
        response = await fetch(url, {
            headers: {
                'Accept':               GITHUB_ACCEPT_HEADER,
                'X-GitHub-Api-Version': GITHUB_API_VERSION,
            },
        });
    } catch (cause) {
        // fetch() solo rechaza la promesa ante fallos de red (no ante 4xx/5xx)
        throw new NetworkError(
            `No se pudo conectar con la API de GitHub. Comprueba tu conexión a Internet.`,
            cause
        );
    }

    // ── Respuesta con error HTTP ───────────────
    if (!response.ok) {
        let apiMessage;
        try {
            const body = await response.json();
            apiMessage = body.message ?? response.statusText;
        } catch {
            apiMessage = response.statusText;
        }
        throw new ApiError(response.status, apiMessage);
    }

    // ── Respuesta exitosa ──────────────────────
    const data = await response.json();
    return data.items ?? [];
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = { fetchTrendingRepos };
