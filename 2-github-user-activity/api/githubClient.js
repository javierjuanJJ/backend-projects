/**
 * @file api/githubClient.js
 * @description Cliente HTTP para la API pública de GitHub.
 * Encapsula la lógica de comunicación con el endpoint de eventos,
 * incluyendo cabeceras, manejo de códigos de estado y errores de red.
 */

/** URL base de la API de GitHub */
const GITHUB_API_BASE = "https://api.github.com";

/**
 * Cabeceras estándar requeridas por la API de GitHub.
 * @see https://docs.github.com/en/rest/overview/media-types
 */
const DEFAULT_HEADERS = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
};

/**
 * Obtiene la lista de eventos públicos recientes de un usuario de GitHub.
 *
 * @param {string} username - Nombre de usuario de GitHub.
 * @returns {Promise<object[]|null>} Array de eventos o `null` si la respuesta fue 304.
 * @throws {Error} Si ocurre un error de red o un estado HTTP no controlado.
 *
 * @example
 * const events = await fetchUserEvents('torvalds');
 */
export async function fetchUserEvents(username) {
    const url = `${GITHUB_API_BASE}/users/${username}/events`;

    let response;

    try {
        response = await fetch(url, { headers: DEFAULT_HEADERS });
    } catch (networkError) {
        // Error de red: sin conexión, DNS fallido, timeout, etc.
        throw new Error(`Error de red al contactar GitHub: ${networkError.message}`);
    }

    return handleResponse(response);
}

/**
 * Interpreta el código de estado HTTP de la respuesta y devuelve los datos
 * o lanza un error con un mensaje descriptivo.
 *
 * @param {Response} response - Objeto Response de la Fetch API.
 * @returns {Promise<object[]|null>} Array de eventos o `null` en caso de 304.
 * @throws {Error} Para códigos de error HTTP conocidos y desconocidos.
 */
async function handleResponse(response) {
    switch (response.status) {
        case 200: {
            // Éxito: parsear y devolver los eventos
            return response.json();
        }

        case 304: {
            // No modificado: los datos en caché siguen siendo válidos
            console.log("ℹ️  304 Not Modified — los datos en caché están actualizados.");
            return null;
        }

        case 403: {
            // Acceso denegado o límite de tasa superado
            const body = await response.json().catch(() => ({}));
            throw new Error(`403 Forbidden: ${body.message ?? "Acceso denegado por GitHub."}`);
        }

        case 404: {
            // Usuario no encontrado
            throw new Error(`404 Not Found: El usuario no existe en GitHub.`);
        }

        case 503: {
            // Servicio no disponible temporalmente
            throw new Error("503 Service Unavailable: La API de GitHub no está disponible. Inténtalo más tarde.");
        }

        default: {
            throw new Error(`Error inesperado de la API: HTTP ${response.status}`);
        }
    }
}
