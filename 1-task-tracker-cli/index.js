/**
 * @file index.js
 * @description Punto de entrada del CLI de gestión de tareas.
 *              Parsea los argumentos, los valida y delega la ejecución
 *              al módulo taskManager.
 *
 * Uso:
 *   node index.js add "<descripción>"
 *   node index.js update <id> "<nueva descripción>"
 *   node index.js delete <id>
 *   node index.js mark-in-progress <id>
 *   node index.js mark-done <id>
 *   node index.js list [todo|in-progress|done]
 */

const { validateActionPresence, validateAction, validateSubArgs } = require('./validator');
const { addTask, updateTask, deleteTask, markInProgress, markDone, listTasks } = require('./taskManager');

// ─────────────────────────────────────────────
//  Parseo de argumentos
// ─────────────────────────────────────────────

/** Argumentos relevantes: se omiten "node" y la ruta del script */
const args    = process.argv.slice(2);

/** Primera palabra: la acción a ejecutar */
const action  = args[0];

/** Resto de palabras: parámetros propios de cada acción */
const subArgs = args.slice(1);

// ─────────────────────────────────────────────
//  Validación y ejecución
// ─────────────────────────────────────────────

try {
    // 1. Verificar que se pasó al menos una acción
    validateActionPresence(args);

    // 2. Verificar que la acción sea válida
    validateAction(action);

    // 3. Verificar que los sub-argumentos sean correctos para la acción
    validateSubArgs(action, subArgs);

    // 4. Ejecutar la acción correspondiente
    switch (action) {
        case 'add':
            addTask(subArgs[0]);
            break;

        case 'update':
            updateTask(subArgs[0], subArgs[1]);
            break;

        case 'delete':
            deleteTask(subArgs[0]);
            break;

        case 'mark-in-progress':
            markInProgress(subArgs[0]);
            break;

        case 'mark-done':
            markDone(subArgs[0]);
            break;

        case 'list':
            // subArgs[0] puede ser undefined → listTasks mostrará todas
            listTasks(subArgs[0] ?? null);
            break;

        default:
            // No debería llegar aquí gracias a validateAction, pero por seguridad:
            throw new Error(`Acción no manejada: "${action}"`);
    }

} catch (err) {
    // Captura centralizada: cualquier error lanzado en validadores o en la
    // capa de negocio llega aquí con un mensaje claro para el usuario.
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
}
