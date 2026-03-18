/**
 * @file src/args.js
 * @description Parseo y validación de argumentos de línea de comandos.
 *              Centraliza la lógica de entrada para mantener limpio el punto de entrada.
 */

'use strict';

const { ArgumentError } = require('./errors');

/** Acciones/flags válidos que acepta la aplicación. */
const ALLOWED_ACTIONS = [
    'add',
    'summary',
    'delete',
    'list',
    '--category',
    '--month',
    '--export-csv',
    '--import-csv',
];

/**
 * Parsea los argumentos de proceso y devuelve la acción principal y sus sub-argumentos.
 *
 * @param {string[]} argv - Argumentos crudos (tipicamente process.argv.slice(2)).
 * @returns {{ action: string, subArgs: string[] }}
 * @throws {ArgumentError} Si no se proporcionan argumentos o la acción no es válida.
 *
 * @example
 * parseArgs(['add', '--description', 'Café', '--amount', '2.50']);
 * // → { action: 'add', subArgs: ['--description', 'Café', '--amount', '2.50'] }
 */
function parseArgs(argv) {
    if (argv.length < 1) {
        throw new ArgumentError(
            'Pocos parámetros.',
            `Uso: node index.js <acción>\nAcciones disponibles: ${ALLOWED_ACTIONS.join(', ')}`
        );
    }

    const action = argv[0];

    if (!ALLOWED_ACTIONS.includes(action)) {
        throw new ArgumentError(
            `Acción inválida: "${action}"`,
            `Acciones disponibles: ${ALLOWED_ACTIONS.join(', ')}`
        );
    }

    return {
        action,
        subArgs: argv.slice(1),
    };
}

module.exports = { parseArgs, ALLOWED_ACTIONS };
