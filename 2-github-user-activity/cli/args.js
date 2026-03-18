/**
 * @file cli/args.js
 * @description Módulo encargado de validar los argumentos de la línea de comandos.
 * Centraliza la lógica de entrada para mantener el índice principal limpio.
 */

/**
 * Valida que se haya proporcionado exactamente un argumento (el nombre de usuario).
 *
 * @param {string[]} args - Array de argumentos recibidos desde process.argv.
 * @returns {string} El nombre de usuario de GitHub validado.
 * @throws {Error} Si el número de argumentos es incorrecto.
 *
 * @example
 * // node index.js torvalds
 * const username = validateArgs(['torvalds']); // → 'torvalds'
 */
export function validateArgs(args) {
    if (args.length !== 1) {
        console.error("❌ Uso correcto: node index.js <github-username>");
        process.exit(1);
    }

    const username = args[0].trim();

    if (!username) {
        console.error("❌ El nombre de usuario no puede estar vacío.");
        process.exit(1);
    }

    return username;
}
