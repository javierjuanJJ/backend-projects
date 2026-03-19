/**
 * @file validator.js
 * @description Validación y normalización de los parámetros del CLI.
 *              Aplica los valores por defecto y comprueba que cada
 *              parámetro sea semánticamente correcto.
 *              Lanza ValidationError con el nombre del parámetro afectado.
 */

const { ValidationError }                           = require('./errors');
const { VALID_DURATIONS, DEFAULT_DURATION,
        DEFAULT_LIMIT, MAX_LIMIT }                  = require('./constants');

// ─────────────────────────────────────────────
//  Validadores individuales
// ─────────────────────────────────────────────

/**
 * Valida el parámetro --duration.
 * Aplica el valor por defecto si no se proporcionó.
 *
 * @param {string|undefined} raw - Valor crudo recibido del parser
 * @returns {string} Duration normalizada y validada
 * @throws {ValidationError}
 */
function validateDuration(raw) {
    const value = raw ?? DEFAULT_DURATION;

    if (!VALID_DURATIONS.includes(value)) {
        throw new ValidationError(
            'duration',
            `Valor inválido para --duration: "${value}". ` +
            `Opciones válidas: ${VALID_DURATIONS.join(' | ')}.`
        );
    }

    return value;
}

/**
 * Valida el parámetro --limit.
 * Aplica el valor por defecto si no se proporcionó.
 *
 * @param {string|undefined} raw - Valor crudo recibido del parser
 * @returns {number} Limit normalizado y validado
 * @throws {ValidationError}
 */
function validateLimit(raw) {
    const rawValue = raw ?? String(DEFAULT_LIMIT);
    const value    = Number(rawValue);

    if (!Number.isInteger(value) || value <= 0) {
        throw new ValidationError(
            'limit',
            `Valor inválido para --limit: "${rawValue}". Debe ser un número entero positivo.`
        );
    }

    if (value > MAX_LIMIT) {
        throw new ValidationError(
            'limit',
            `El valor de --limit no puede superar ${MAX_LIMIT}. Recibido: ${value}.`
        );
    }

    return value;
}

// ─────────────────────────────────────────────
//  Validador principal
// ─────────────────────────────────────────────

/**
 * Valida y normaliza todos los parámetros del CLI a la vez.
 *
 * @param {{ duration?: string, limit?: string }} raw - Objeto producido por parseArgs
 * @returns {{ duration: string, limit: number }} Parámetros normalizados
 * @throws {ValidationError}
 */
function validateParams({ duration, limit }) {
    return {
        duration: validateDuration(duration),
        limit:    validateLimit(limit),
    };
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = { validateParams, validateDuration, validateLimit };
