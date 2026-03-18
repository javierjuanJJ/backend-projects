/**
 * @file taskManager.js
 * @description Módulo de lógica de negocio para la gestión de tareas.
 *              Contiene todas las operaciones CRUD y de cambio de estado.
 *              Depende de fileHandler para la persistencia de datos.
 */

const crypto = require('crypto');
const { readTasks, writeTasks } = require('./fileHandler');

/**
 * Busca una tarea por su ID dentro del arreglo de tareas.
 * Lanza un error si no se encuentra.
 *
 * @param {Array<Object>} tasks - Arreglo de tareas.
 * @param {string}        id    - UUID de la tarea a buscar.
 * @returns {{ task: Object, index: number }} La tarea encontrada y su índice.
 * @throws {Error} Si no se encuentra ninguna tarea con ese ID.
 */
function findTaskOrThrow(tasks, id) {
    const index = tasks.findIndex(t => t.id === id);

    if (index === -1) {
        throw new Error(`No se encontró ninguna tarea con el ID: ${id}`);
    }

    return { task: tasks[index], index };
}

// ─────────────────────────────────────────────
//  OPERACIONES CRUD
// ─────────────────────────────────────────────

/**
 * Crea una nueva tarea con status "todo" y la persiste.
 *
 * @param {string} description - Texto descriptivo de la tarea.
 * @returns {Object} La tarea recién creada.
 */
function addTask(description) {
    const tasks = readTasks();

    const newTask = {
        id:          crypto.randomUUID(),
        description,
        status:      'todo',
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
    };

    tasks.push(newTask);
    writeTasks(tasks);

    console.log('✅ Tarea añadida:', newTask);
    return newTask;
}

/**
 * Actualiza la descripción de una tarea existente.
 *
 * @param {string} id             - UUID de la tarea a actualizar.
 * @param {string} newDescription - Nueva descripción para la tarea.
 * @returns {Object} La tarea actualizada.
 * @throws {Error} Si no existe la tarea con ese ID.
 */
function updateTask(id, newDescription) {
    const tasks = readTasks();
    const { task, index } = findTaskOrThrow(tasks, id);

    tasks[index].description = newDescription;
    tasks[index].updatedAt   = new Date().toISOString();
    writeTasks(tasks);

    console.log('✅ Tarea actualizada:', tasks[index]);
    return tasks[index];
}

/**
 * Elimina una tarea del arreglo y persiste los cambios.
 *
 * @param {string} id - UUID de la tarea a eliminar.
 * @returns {Object} La tarea eliminada.
 * @throws {Error} Si no existe la tarea con ese ID.
 */
function deleteTask(id) {
    const tasks = readTasks();
    const { task, index } = findTaskOrThrow(tasks, id);

    const [deleted] = tasks.splice(index, 1);
    writeTasks(tasks);

    console.log('✅ Tarea eliminada:', deleted);
    return deleted;
}

// ─────────────────────────────────────────────
//  CAMBIOS DE ESTADO
// ─────────────────────────────────────────────

/**
 * Marca una tarea como "in-progress".
 *
 * @param {string} id - UUID de la tarea.
 * @returns {Object} La tarea actualizada.
 * @throws {Error} Si no existe la tarea con ese ID.
 */
function markInProgress(id) {
    return changeStatus(id, 'in-progress');
}

/**
 * Marca una tarea como "done".
 *
 * @param {string} id - UUID de la tarea.
 * @returns {Object} La tarea actualizada.
 * @throws {Error} Si no existe la tarea con ese ID.
 */
function markDone(id) {
    return changeStatus(id, 'done');
}

/**
 * Función interna para actualizar el campo `status` de una tarea.
 *
 * @param {string} id        - UUID de la tarea.
 * @param {string} newStatus - Nuevo estado ('todo' | 'in-progress' | 'done').
 * @returns {Object} La tarea con el estado actualizado.
 * @throws {Error} Si no existe la tarea con ese ID.
 */
function changeStatus(id, newStatus) {
    const tasks = readTasks();
    const { index } = findTaskOrThrow(tasks, id);

    tasks[index].status    = newStatus;
    tasks[index].updatedAt = new Date().toISOString();
    writeTasks(tasks);

    console.log(`✅ Tarea marcada como "${newStatus}":`, tasks[index]);
    return tasks[index];
}

// ─────────────────────────────────────────────
//  LISTADO
// ─────────────────────────────────────────────

/**
 * Lista las tareas, opcionalmente filtradas por status.
 * Si no se proporciona filtro, muestra todas las tareas.
 *
 * @param {string|null} [statusFilter=null] - Status por el que filtrar ('todo' | 'in-progress' | 'done').
 * @returns {Array<Object>} Arreglo de tareas que coinciden con el filtro.
 */
function listTasks(statusFilter = null) {
    const tasks = readTasks();

    const result = statusFilter
        ? tasks.filter(t => t.status === statusFilter)
        : tasks;

    if (result.length === 0) {
        const msg = statusFilter
            ? `📋 No hay tareas con status "${statusFilter}".`
            : '📋 No hay tareas registradas.';
        console.log(msg);
    } else {
        const header = statusFilter
            ? `📋 Tareas con status "${statusFilter}" (${result.length}):`
            : `📋 Todas las tareas (${result.length}):`;
        console.log(header);
        result.forEach(t =>
            console.log(`  [${t.status.padEnd(11)}] ${t.id}  →  ${t.description}`)
        );
    }

    return result;
}

module.exports = { addTask, updateTask, deleteTask, markInProgress, markDone, listTasks };
