/**
 * @file errors.js
 * @description Clases de error personalizadas para el CLI de GitHub Trending.
 *              Cada tipo de error tiene su propia clase, lo que permite
 *              capturarlos de forma diferenciada en index.js con instanceof.
 */

// ─────────────────────────────────────────────
//  Error de parseo de argumentos
// ─────────────────────────────────────────────

/**
 * Se lanza cuando el formato de los argumentos CLI es incorrecto.
 * Ejemplos: flag sin valor, argumento sin prefijo --.
 */
class ParseError extends Error {
    /**
     * @param {string} message - Descripción del problema de parseo
     */
    constructor(message) {
        super(message);
        this.name = 'ParseError';
    }
}

// ─────────────────────────────────────────────
//  Error de validación de parámetros
// ─────────────────────────────────────────────

/**
 * Se lanza cuando un parámetro tiene un valor fuera del rango o tipo esperado.
 * Ejemplos: duration inválida, limit no numérico o mayor que el máximo.
 */
class ValidationError extends Error {
    /**
     * @param {string} param   - Nombre del parámetro que falló la validación
     * @param {string} message - Descripción del problema
     */
    constructor(param, message) {
        super(message);
        this.name  = 'ValidationError';
        this.param = param;
    }
}

// ─────────────────────────────────────────────
//  Error de red / conectividad
// ─────────────────────────────────────────────

/**
 * Se lanza cuando la petición HTTP falla antes de recibir respuesta.
 * Ejemplo: sin conexión a Internet, timeout, DNS no resuelto.
 */
class NetworkError extends Error {
    /**
     * @param {string} message - Descripción del fallo de red
     * @param {Error}  [cause]  - Error original de fetch (opcional)
     */
    constructor(message, cause) {
        super(message);
        this.name  = 'NetworkError';
        this.cause = cause;
    }
}

// ─────────────────────────────────────────────
//  Error de la API de GitHub
// ─────────────────────────────────────────────

/**
 * Se lanza cuando la API responde con un código HTTP de error (4xx / 5xx).
 * Incluye el status code para poder reaccionar de forma específica si se desea.
 */
class ApiError extends Error {
    /**
     * @param {number} status  - Código HTTP recibido (ej. 403, 422, 500)
     * @param {string} message - Mensaje devuelto por la API
     */
    constructor(status, message) {
        super(message);
        this.name   = 'ApiError';
        this.status = status;
    }
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = { ParseError, ValidationError, NetworkError, ApiError };
