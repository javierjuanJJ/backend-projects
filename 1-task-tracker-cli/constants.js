/**
 * @file constants.js
 * @description Constantes compartidas en todo el proyecto.
 */

const path = require('path');

/** Ruta absoluta al archivo de almacenamiento de tareas */
const TASKS_FILE_PATH = path.join(process.cwd(), 'tasks.json');

/** Acciones permitidas como primer argumento del CLI */
const ALLOWED_ACTIONS = ['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list'];

/** Estados válidos para una tarea */
const VALID_STATUSES = ['todo', 'in-progress', 'done'];

module.exports = { TASKS_FILE_PATH, ALLOWED_ACTIONS, VALID_STATUSES };
