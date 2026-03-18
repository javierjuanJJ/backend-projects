/**
 * @file validator.js
 * @description Módulo de validación de argumentos recibidos por el CLI.
 *              Centraliza todas las comprobaciones para mantener el código limpio.
 */

const { ALLOWED_ACTIONS, VALID_STATUSES } = require('./constants');

/**
 * Valida que se haya proporcionado al menos una acción.
 *
 * @param {string[]} args - Argumentos del CLI (sin `node` ni el nombre del script).
 * @throws {Error} Si no se pasa ningún argumento.
 */
function validateActionPresence(args) {
    if (args.length < 1) {
        throw new Error(
            `Pocos parámetros. Uso:\n  node index.js <acción> [...args]\n` +
            `Acciones disponibles: ${ALLOWED_ACTIONS.join(', ')}`
        );
    }
}

/**
 * Valida que la acción proporcionada sea una de las permitidas.
 *
 * @param {string} action - Acción ingresada por el usuario.
 * @throws {Error} Si la acción no está en la lista permitida.
 */
function validateAction(action) {
    if (!ALLOWED_ACTIONS.includes(action)) {
        throw new Error(
            `Acción inválida: "${action}".\nAcciones disponibles: ${ALLOWED_ACTIONS.join(', ')}`
        );
    }
}

/**
 * Valida los sub-argumentos requeridos según la acción.
 *
 * @param {string}   action  - Acción a ejecutar.
 * @param {string[]} subArgs - Sub-argumentos adicionales.
 * @throws {Error} Si los sub-argumentos no cumplen los requisitos de la acción.
 */
function validateSubArgs(action, subArgs) {
    switch (action) {
        case 'add':
            if (subArgs.length !== 1) {
                throw new Error('El comando "add" requiere exactamente una descripción.\nUso: node index.js add "<descripción>"');
            }
            break;

        case 'update':
            if (subArgs.length !== 2) {
                throw new Error('El comando "update" requiere un ID y una nueva descripción.\nUso: node index.js update <id> "<nueva descripción>"');
            }
            break;

        case 'delete':
        case 'mark-in-progress':
        case 'mark-done':
            if (subArgs.length !== 1) {
                throw new Error(`El comando "${action}" requiere exactamente un ID.\nUso: node index.js ${action} <id>`);
            }
            break;

        case 'list':
            // Sin sub-argumentos → listar todas; con uno → filtrar por status
            if (subArgs.length > 1) {
                throw new Error('El comando "list" acepta como máximo un status.\nUso: node index.js list [todo|in-progress|done]');
            }
            if (subArgs.length === 1 && !VALID_STATUSES.includes(subArgs[0])) {
                throw new Error(
                    `Status inválido: "${subArgs[0]}".\nStatuses válidos: ${VALID_STATUSES.join(', ')}`
                );
            }
            break;

        default:
            break;
    }
}

module.exports = { validateActionPresence, validateAction, validateSubArgs };
