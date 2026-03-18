/**
 * @file src/csv.js
 * @description Utilidades para importar y exportar gastos en formato CSV.
 *              Gestiona el escapado/desescapado de campos y la cabecera del fichero.
 */

'use strict';

const fs = require('fs');
const { FileError } = require('./errors');

/** Cabecera estándar del CSV de gastos. */
const CSV_HEADER = 'id,description,amount,category,createdAt,updatedAt';

/**
 * Parsea una línea CSV respetando comillas dobles.
 *
 * @param {string} line - Línea cruda del CSV.
 * @returns {string[]} Array de valores sin comillas.
 *
 * @example
 * parseCsvLine('"abc","Café con leche","2.50","general"');
 * // → ['abc', 'Café con leche', '2.50', 'general']
 */
function parseCsvLine(line) {
    return line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
}

/**
 * Exporta un array de gastos a un fichero CSV.
 *
 * @param {import('./storage').Expense[]} expenses - Gastos a exportar.
 * @param {string} filePath                        - Ruta del fichero CSV de destino.
 * @throws {FileError} Si no se puede escribir el fichero.
 */
function exportToCsv(expenses, filePath) {
    const rows = expenses.map(e =>
        `"${e.id}","${e.description}","${e.amount}","${e.category || 'general'}","${e.createdAt}","${e.updatedAt}"`
    );

    const content = [CSV_HEADER, ...rows].join('\n');

    try {
        fs.writeFileSync(filePath, content, 'utf-8');
    } catch (err) {
        throw new FileError(`No se pudo escribir el CSV en "${filePath}": ${err.message}`);
    }
}

/**
 * Importa gastos desde un fichero CSV.
 * Los registros con IDs ya existentes en `existingIds` son ignorados (deduplicación).
 *
 * @param {string}      filePath    - Ruta del fichero CSV a leer.
 * @param {Set<string>} existingIds - Conjunto de IDs ya almacenados.
 * @returns {{ imported: import('./storage').Expense[], duplicates: number }}
 * @throws {FileError} Si el fichero no existe o no se puede leer.
 */
function importFromCsv(filePath, existingIds) {
    if (!fs.existsSync(filePath)) {
        throw new FileError(`No se encontró el fichero: "${filePath}"`);
    }

    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        throw new FileError(`No se pudo leer el fichero "${filePath}": ${err.message}`);
    }

    // Filtrar líneas vacías y saltar la cabecera
    const lines = raw.split('\n').filter(l => l.trim() !== '').slice(1);

    const all = lines.map(line => {
        const [id, description, amount, category, createdAt, updatedAt] = parseCsvLine(line);
        return {
            id: id || crypto.randomUUID(),
            description,
            amount: parseFloat(amount),
            category: category || 'general',
            createdAt: createdAt || new Date().toISOString(),
            updatedAt: updatedAt || new Date().toISOString(),
        };
    });

    const imported = all.filter(e => !existingIds.has(e.id));
    const duplicates = all.length - imported.length;

    return { imported, duplicates };
}

module.exports = { exportToCsv, importFromCsv, parseCsvLine };
