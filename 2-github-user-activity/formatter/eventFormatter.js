/**
 * @file formatter/eventFormatter.js
 * @description Módulo de presentación: convierte los eventos crudos de la API
 * de GitHub en líneas de texto legibles para el usuario.
 *
 * Cada tipo de evento tiene su propio formateador privado.
 * Los tipos desconocidos reciben un mensaje genérico en lugar de ser ignorados.
 */

/**
 * Convierte un array de eventos de GitHub en líneas de texto formateadas.
 *
 * @param {object[]} events - Eventos crudos devueltos por la API de GitHub.
 * @returns {string[]} Array de cadenas listas para imprimir.
 *
 * @example
 * const lines = formatEvents(events);
 * lines.forEach(line => console.log(line));
 */
export function formatEvents(events) {
    if (!Array.isArray(events) || events.length === 0) {
        return ["ℹ️  No se encontró actividad pública reciente para este usuario."];
    }

    return events.map(formatSingleEvent);
}

/**
 * Formatea un único evento según su tipo.
 *
 * @param {object} event - Evento individual de la API de GitHub.
 * @returns {string} Línea de texto formateada.
 */
function formatSingleEvent(event) {
    const repo = event.repo?.name ?? "repositorio desconocido";

    switch (event.type) {
        case "PushEvent":
            return formatPushEvent(event, repo);
        case "IssuesEvent":
            return formatIssuesEvent(event, repo);
        case "WatchEvent":
            return `- Starred ${repo}`;
        case "ForkEvent":
            return `- Forked ${repo}`;
        case "PullRequestEvent":
            return formatPullRequestEvent(event, repo);
        case "CreateEvent":
            return formatCreateEvent(event, repo);
        default:
            // Tipo desconocido: muestra el nombre del evento sin el sufijo "Event"
            return `- ${event.type.replace("Event", "")} activity in ${repo}`;
    }
}

// ─── Formateadores por tipo de evento ────────────────────────────────────────

/**
 * Formatea un evento de push (commits enviados a una rama).
 *
 * @param {object} event - Evento de tipo PushEvent.
 * @param {string} repo  - Nombre del repositorio.
 * @returns {string}
 */
function formatPushEvent(event, repo) {
    const count = event.payload?.commits?.length ?? 0;
    const plural = count !== 1 ? "s" : "";
    return `- Pushed ${count} commit${plural} to ${repo}`;
}

/**
 * Formatea un evento de issue (apertura, cierre, reapertura, etc.).
 *
 * @param {object} event - Evento de tipo IssuesEvent.
 * @param {string} repo  - Nombre del repositorio.
 * @returns {string}
 */
function formatIssuesEvent(event, repo) {
    const action = event.payload?.action ?? "unknown action on";
    if (action === "opened") {
        return `- Opened a new issue in ${repo}`;
    }
    return `- ${action} an issue in ${repo}`;
}

/**
 * Formatea un evento de pull request.
 *
 * @param {object} event - Evento de tipo PullRequestEvent.
 * @param {string} repo  - Nombre del repositorio.
 * @returns {string}
 */
function formatPullRequestEvent(event, repo) {
    const action = event.payload?.action ?? "interacted with";
    return `- ${action} a pull request in ${repo}`;
}

/**
 * Formatea un evento de creación (rama, tag o repositorio).
 *
 * @param {object} event - Evento de tipo CreateEvent.
 * @param {string} repo  - Nombre del repositorio.
 * @returns {string}
 */
function formatCreateEvent(event, repo) {
    const refType = event.payload?.ref_type ?? "resource";
    return `- Created a new ${refType} in ${repo}`;
}
