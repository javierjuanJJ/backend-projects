/**
 * @file parser.js
 * @description Parseo de los argumentos recibidos desde la línea de comandos.
 *              Soporta únicamente el formato: --flag valor
 *              Lanza ParseError ante cualquier formato inesperado.
 */

const { ParseError } = require('./errors');

// ─────────────────────────────────────────────
//  Función principal
// ─────────────────────────────────────────────

/**
 * Transforma el array de argumentos CLI en un objeto clave-valor.
 *
 * Reglas:
 *  - Cada flag debe comenzar con "--"
 *  - Cada flag debe ir seguido de su valor (sin "--")
 *  - No se admiten argumentos posicionales sin flag
 *
 * @param {string[]} argv - Argumentos del proceso (sin node ni ruta del script)
 * @returns {{ [key: string]: string }} Mapa de flag → valor
 * @throws {ParseError} Si el formato de algún argumento es incorrecto
 *
 * @example
 * parseArgs(['--duration', 'week', '--limit', '10'])
 * // → { duration: 'week', limit: '10' }
 */
function parseArgs(argv) {
    const result = {};

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (!arg.startsWith('--')) {
            throw new ParseError(
                `Argumento inesperado: "${arg}". Todos los argumentos deben usar el formato --flag valor.`
            );
        }

        const key   = arg.slice(2);
        const value = argv[i + 1];

        if (key === '') {
            throw new ParseError(
                `Flag vacío detectado ("--"). Usa el formato --flag valor.`
            );
        }

        if (value === undefined || value.startsWith('--')) {
            throw new ParseError(
                `El flag "--${key}" requiere un valor. Ejemplo: --${key} <valor>.`
            );
        }

        if (key in result) {
            throw new ParseError(
                `El flag "--${key}" está duplicado. Cada flag solo puede aparecer una vez.`
            );
        }

        result[key] = value;
        i++; // el siguiente token es el valor, ya lo procesamos
    }

    return result;
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = { parseArgs };
