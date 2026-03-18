/**
 * @file src/router.js
 * @description Tabla de enrutamiento entre acciones CLI y funciones de comando.
 *              Desacopla el punto de entrada de la lógica de negocio.
 */

'use strict';

const {
    cmdAdd,
    cmdSummary,
    cmdDelete,
    cmdList,
    cmdFilterByCategory,
    cmdFilterByMonth,
    cmdExportCsv,
    cmdImportCsv,
} = require('./commands');

const { ArgumentError } = require('./errors');

/**
 * Mapa de acción → función de comando.
 * Añadir una nueva acción solo requiere ampliar este objeto.
 *
 * @type {Record<string, (subArgs: string[]) => void | Promise<void>>}
 */
const COMMAND_MAP = {
    'add':          cmdAdd,
    'summary':      cmdSummary,
    'delete':       cmdDelete,
    'list':         cmdList,
    '--category':   cmdFilterByCategory,
    '--month':      cmdFilterByMonth,
    '--export-csv': cmdExportCsv,
    '--import-csv': cmdImportCsv,
};

/**
 * Resuelve y ejecuta el comando correspondiente a la acción indicada.
 *
 * @param {string}   action  - Acción validada por el parser de argumentos.
 * @param {string[]} subArgs - Argumentos adicionales para el comando.
 * @returns {Promise<void>}
 * @throws {ArgumentError} Si la acción no tiene un handler registrado.
 */
async function runCommand(action, subArgs) {
    const handler = COMMAND_MAP[action];

    if (!handler) {
        // No debería ocurrir si parseArgs valida correctamente, pero lo cubrimos por seguridad.
        throw new ArgumentError(`Acción sin handler registrado: "${action}"`);
    }

    await handler(subArgs);
}

module.exports = { runCommand };
