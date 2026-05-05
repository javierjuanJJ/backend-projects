/**
 * @file __tests__/fixtures/events.js
 * @description Fixtures compartidos entre todos los archivos de test.
 *
 * Centralizar los datos de prueba evita duplicación y facilita
 * mantener los tests sincronizados con los cambios de la API.
 *
 * Convención de nombres:
 *   make<Tipo>Event(overrides?)  → devuelve un evento mínimo válido
 *                                  con valores por defecto sobreescribibles.
 */

/**
 * Crea un evento de tipo PushEvent.
 *
 * @param {object} [overrides={}] - Propiedades que sobreescriben los valores por defecto.
 * @returns {object} Evento PushEvent simulado.
 */
export function makePushEvent(overrides = {}) {
    return {
        type: "PushEvent",
        repo: { name: "user/repo" },
        payload: { commits: [{}, {}] }, // 2 commits por defecto
        ...overrides,
    };
}

/**
 * Crea un evento de tipo IssuesEvent.
 *
 * @param {"opened"|"closed"|"reopened"} [action="opened"] - Acción del issue.
 * @param {object} [overrides={}] - Propiedades adicionales.
 * @returns {object} Evento IssuesEvent simulado.
 */
export function makeIssuesEvent(action = "opened", overrides = {}) {
    return {
        type: "IssuesEvent",
        repo: { name: "user/repo" },
        payload: { action },
        ...overrides,
    };
}

/**
 * Crea un evento de tipo WatchEvent (star).
 *
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeWatchEvent(overrides = {}) {
    return {
        type: "WatchEvent",
        repo: { name: "user/repo" },
        payload: {},
        ...overrides,
    };
}

/**
 * Crea un evento de tipo ForkEvent.
 *
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeForkEvent(overrides = {}) {
    return {
        type: "ForkEvent",
        repo: { name: "user/repo" },
        payload: {},
        ...overrides,
    };
}

/**
 * Crea un evento de tipo PullRequestEvent.
 *
 * @param {"opened"|"closed"|"merged"} [action="opened"] - Acción del PR.
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makePullRequestEvent(action = "opened", overrides = {}) {
    return {
        type: "PullRequestEvent",
        repo: { name: "user/repo" },
        payload: { action },
        ...overrides,
    };
}

/**
 * Crea un evento de tipo CreateEvent.
 *
 * @param {"branch"|"tag"|"repository"} [refType="branch"] - Tipo de recurso creado.
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeCreateEvent(refType = "branch", overrides = {}) {
    return {
        type: "CreateEvent",
        repo: { name: "user/repo" },
        payload: { ref_type: refType },
        ...overrides,
    };
}

/**
 * Crea un evento de tipo desconocido/genérico.
 *
 * @param {string} [type="UnknownEvent"] - Tipo personalizado.
 * @param {object} [overrides={}]
 * @returns {object}
 */
export function makeUnknownEvent(type = "UnknownEvent", overrides = {}) {
    return {
        type,
        repo: { name: "user/repo" },
        payload: {},
        ...overrides,
    };
}

/**
 * Crea un mock de Response de la Fetch API.
 *
 * @param {number} status         - Código de estado HTTP.
 * @param {object|null} [body]    - Cuerpo JSON a devolver en .json().
 * @returns {object} Mock de Response con .status y .json().
 */
export function makeFetchResponse(status, body = null) {
    return {
        status,
        ok: status >= 200 && status < 300,
        json: jest.fn().mockResolvedValue(body),
    };
}
