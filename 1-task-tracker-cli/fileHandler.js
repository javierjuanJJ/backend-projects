/**
 * @file fileHandler.js
 * @description Módulo encargado de la lectura y escritura del archivo JSON
 *              que actúa como base de datos local para las tareas.
 */

const fs   = require('fs');
const { TASKS_FILE_PATH } = require('./constants');

/**
 * Lee las tareas almacenadas en el archivo JSON.
 * Si el archivo no existe, retorna un arreglo vacío.
 *
 * @returns {Array<Object>} Arreglo de tareas.
 * @throws {Error} Si el archivo existe pero su contenido no es JSON válido.
 */
function readTasks() {
    if (!fs.existsSync(TASKS_FILE_PATH)) {
        return [];
    }

    const raw = fs.readFileSync(TASKS_FILE_PATH, 'utf-8');

    try {
        const parsed = JSON.parse(raw);

        // Validar que el contenido sea un arreglo
        if (!Array.isArray(parsed)) {
            throw new Error('El archivo de tareas no contiene un arreglo válido.');
        }

        return parsed;
    } catch (err) {
        throw new Error(`Error al leer tasks.json: ${err.message}`);
    }
}

/**
 * Escribe el arreglo de tareas en el archivo JSON.
 *
 * @param {Array<Object>} tasks - Arreglo de tareas a guardar.
 * @throws {Error} Si no se puede escribir el archivo.
 */
function writeTasks(tasks) {
    try {
        fs.writeFileSync(TASKS_FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
    } catch (err) {
        throw new Error(`Error al escribir tasks.json: ${err.message}`);
    }
}

module.exports = { readTasks, writeTasks };
