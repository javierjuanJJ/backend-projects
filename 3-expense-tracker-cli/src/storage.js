/**
 * @file src/storage.js
 * @description Capa de persistencia. Gestiona la lectura y escritura del fichero JSON
 *              que actúa como base de datos local de gastos.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { FileError } = require('./errors');

/** Ruta absoluta al fichero de datos. */
const DATA_PATH = path.join(process.cwd(), 'expresses.json');

/**
 * Lee los gastos almacenados en disco.
 *
 * @returns {Expense[]} Array de gastos (vacío si el fichero no existe).
 * @throws {FileError} Si el fichero existe pero no se puede parsear o leer.
 *
 * @typedef {Object} Expense
 * @property {string} id          - UUID único del gasto.
 * @property {string} description - Descripción del gasto.
 * @property {number} amount      - Importe en euros.
 * @property {string} category    - Categoría del gasto.
 * @property {string} createdAt   - Fecha de creación (ISO 8601).
 * @property {string} updatedAt   - Fecha de última modificación (ISO 8601).
 */
function readExpenses() {
    if (!fs.existsSync(DATA_PATH)) {
        return [];
    }

    try {
        const raw = fs.readFileSync(DATA_PATH, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        throw new FileError(
            `No se pudo leer el fichero de datos (${DATA_PATH}): ${err.message}`
        );
    }
}

/**
 * Persiste el array completo de gastos en disco.
 *
 * @param {Expense[]} expenses - Array de gastos a guardar.
 * @throws {FileError} Si no se puede escribir en disco.
 */
function writeExpenses(expenses) {
    try {
        fs.writeFileSync(DATA_PATH, JSON.stringify(expenses, null, 2), 'utf-8');
    } catch (err) {
        throw new FileError(
            `No se pudo escribir en el fichero de datos (${DATA_PATH}): ${err.message}`
        );
    }
}

module.exports = { readExpenses, writeExpenses, DATA_PATH };
