/**
 * @file index.js
 * @description Punto de entrada principal de la aplicación de gestión de gastos.
 *              Valida los argumentos de entrada y delega en el router de comandos.
 */

'use strict';

const { parseArgs } = require('./src/args');
const { runCommand } = require('./src/router');
const { AppError } = require('./src/errors');

/**
 * Función principal que orquesta la ejecución de la app.
 */
async function main() {
    try {
        const { action, subArgs } = parseArgs(process.argv.slice(2));
        await runCommand(action, subArgs);
    } catch (err) {
        if (err instanceof AppError) {
            console.error(`❌ ${err.message}`);
            if (err.hint) console.error(`   💡 ${err.hint}`);
        } else {
            console.error('❌ Error inesperado:', err.message);
        }
        process.exit(1);
    }
}

main();
