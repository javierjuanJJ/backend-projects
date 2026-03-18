/**
 * @file src/commands.js
 * @description Implementación de cada comando disponible en la aplicación.
 *              Cada función recibe los sub-argumentos ya validados y ejecuta
 *              la lógica de negocio correspondiente, delegando en storage y csv.
 */

'use strict';

const { readExpenses, writeExpenses } = require('./storage');
const { exportToCsv, importFromCsv } = require('./csv');
const { ArgumentError, NotFoundError } = require('./errors');

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * Crea una nueva instancia de gasto con valores por defecto.
 *
 * @param {string} description
 * @param {number} amount
 * @param {string} [category='general']
 * @returns {import('./storage').Expense}
 */
function buildExpense(description, amount, category = 'general') {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        description,
        amount,
        category,
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Suma el importe total de un array de gastos.
 *
 * @param {import('./storage').Expense[]} expenses
 * @returns {number}
 */
function sumAmounts(expenses) {
    return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
}

// ─── Comandos ────────────────────────────────────────────────────────────────

/**
 * Añade un nuevo gasto.
 *
 * Uso: add --description <desc> --amount <importe> [--category <cat>]
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si los argumentos no son válidos.
 */
function cmdAdd(subArgs) {
    // Extraer valores de los flags mediante índice
    const descIdx   = subArgs.indexOf('--description');
    const amountIdx = subArgs.indexOf('--amount');
    const catIdx    = subArgs.indexOf('--category');

    if (descIdx === -1 || amountIdx === -1) {
        throw new ArgumentError(
            'Faltan argumentos obligatorios.',
            'Uso: node index.js add --description <desc> --amount <importe> [--category <cat>]'
        );
    }

    const description = subArgs[descIdx + 1];
    const rawAmount   = subArgs[amountIdx + 1];
    const category    = catIdx !== -1 ? subArgs[catIdx + 1] : 'general';

    if (!description || description.startsWith('--')) {
        throw new ArgumentError('La descripción no puede estar vacía.');
    }

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount < 0) {
        throw new ArgumentError('El importe debe ser un número positivo válido.');
    }

    const expense  = buildExpense(description, amount, category);
    const expenses = readExpenses();
    expenses.push(expense);
    writeExpenses(expenses);

    console.log('✅ Gasto añadido:', expense);
}

/**
 * Muestra un resumen global de todos los gastos agrupados por categoría.
 *
 * Uso: summary
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si se pasan argumentos inesperados.
 */
function cmdSummary(subArgs) {
    if (subArgs.length > 0) {
        throw new ArgumentError('Este comando no acepta argumentos.', 'Uso: node index.js summary');
    }

    const expenses = readExpenses();

    if (expenses.length === 0) {
        console.log('📭 No hay gastos registrados.');
        return;
    }

    const total = sumAmounts(expenses);

    // Agrupar importes por categoría
    const byCategory = expenses.reduce((acc, e) => {
        const cat = e.category || 'general';
        acc[cat] = (acc[cat] || 0) + parseFloat(e.amount);
        return acc;
    }, {});

    console.log('\n📊 Resumen de gastos:');
    console.log('─'.repeat(40));
    console.log(`  Total de gastos: ${expenses.length}`);
    console.log(`  Importe total:   ${total.toFixed(2)} €`);
    console.log('\n  Por categoría:');
    for (const [cat, amount] of Object.entries(byCategory)) {
        console.log(`    • ${cat}: ${amount.toFixed(2)} €`);
    }
    console.log('─'.repeat(40));
}

/**
 * Elimina un gasto por su ID.
 *
 * Uso: delete --id <uuid>
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si no se proporciona el ID.
 * @throws {NotFoundError} Si no existe ningún gasto con ese ID.
 */
function cmdDelete(subArgs) {
    const idIdx = subArgs.indexOf('--id');

    if (idIdx === -1 || !subArgs[idIdx + 1]) {
        throw new ArgumentError(
            'Falta el argumento --id.',
            'Uso: node index.js delete --id <uuid>'
        );
    }

    const id       = subArgs[idIdx + 1];
    const expenses = readExpenses();
    const index    = expenses.findIndex(e => e.id === id);

    if (index === -1) {
        throw new NotFoundError(`No se encontró ningún gasto con ID: ${id}`);
    }

    const [deleted] = expenses.splice(index, 1);
    writeExpenses(expenses);

    console.log('🗑️  Gasto eliminado:', deleted);
}

/**
 * Lista todos los gastos en formato tabular.
 *
 * Uso: list
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si se pasan argumentos inesperados.
 */
function cmdList(subArgs) {
    if (subArgs.length > 0) {
        throw new ArgumentError('Este comando no acepta argumentos.', 'Uso: node index.js list');
    }

    const expenses = readExpenses();

    if (expenses.length === 0) {
        console.log('📭 No hay gastos registrados.');
        return;
    }

    const SEP = '─'.repeat(70);
    console.log('\n📋 Lista de gastos:');
    console.log(SEP);
    console.log('  ID (corto)   Descripción                  Importe     Categoría');
    console.log(SEP);

    expenses.forEach(e => {
        const shortId = `${e.id.slice(0, 8)}...`;
        const desc    = e.description.padEnd(28).slice(0, 28);
        const amount  = `${parseFloat(e.amount).toFixed(2)} €`.padStart(10);
        const cat     = e.category || 'general';
        console.log(`  ${shortId}  ${desc}  ${amount}  ${cat}`);
    });

    console.log(SEP);
    console.log(`  Total: ${sumAmounts(expenses).toFixed(2)} €`);
}

/**
 * Filtra y muestra los gastos de una categoría concreta.
 *
 * Uso: --category <nombre>
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si no se proporciona la categoría.
 */
function cmdFilterByCategory(subArgs) {
    if (subArgs.length !== 1) {
        throw new ArgumentError(
            'Argumento inválido.',
            'Uso: node index.js --category <categoría>'
        );
    }

    const category = subArgs[0];
    const expenses = readExpenses();
    const filtered = expenses.filter(
        e => (e.category || 'general').toLowerCase() === category.toLowerCase()
    );

    if (filtered.length === 0) {
        console.log(`📭 No hay gastos en la categoría "${category}".`);
        return;
    }

    const SEP = '─'.repeat(50);
    console.log(`\n📂 Gastos en categoría "${category}":`);
    console.log(SEP);
    filtered.forEach(e => {
        console.log(
            `  [${e.id.slice(0, 8)}...] ${e.description} — ${parseFloat(e.amount).toFixed(2)} €  (${e.createdAt.slice(0, 10)})`
        );
    });
    console.log(SEP);
    console.log(`  Total: ${sumAmounts(filtered).toFixed(2)} €`);
}

/**
 * Filtra y muestra los gastos de un mes concreto (del año actual).
 *
 * Uso: --month <1-12>
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si el mes no es un número válido entre 1 y 12.
 */
function cmdFilterByMonth(subArgs) {
    if (subArgs.length !== 1) {
        throw new ArgumentError(
            'Argumento inválido.',
            'Uso: node index.js --month <1-12>'
        );
    }

    const month = parseInt(subArgs[0], 10);

    if (isNaN(month) || month < 1 || month > 12) {
        throw new ArgumentError('El mes debe ser un número entre 1 y 12.');
    }

    const expenses = readExpenses();
    const filtered = expenses.filter(e => new Date(e.createdAt).getMonth() + 1 === month);

    if (filtered.length === 0) {
        console.log(`📭 No hay gastos en el mes ${month}.`);
        return;
    }

    const monthName = new Date(2000, month - 1).toLocaleString('es-ES', { month: 'long' });
    const SEP       = '─'.repeat(50);

    console.log(`\n📅 Gastos de ${monthName}:`);
    console.log(SEP);
    filtered.forEach(e => {
        console.log(
            `  [${e.id.slice(0, 8)}...] ${e.description} — ${parseFloat(e.amount).toFixed(2)} €`
        );
    });
    console.log(SEP);
    console.log(`  Total: ${sumAmounts(filtered).toFixed(2)} €`);
}

/**
 * Exporta todos los gastos a un fichero CSV.
 *
 * Uso: --export-csv <ruta/archivo.csv>
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si no se proporciona la ruta del fichero.
 */
function cmdExportCsv(subArgs) {
    if (subArgs.length !== 1) {
        throw new ArgumentError(
            'Argumento inválido.',
            'Uso: node index.js --export-csv <archivo.csv>'
        );
    }

    const filePath = subArgs[0];
    const expenses = readExpenses();

    if (expenses.length === 0) {
        console.log('📭 No hay gastos para exportar.');
        return;
    }

    exportToCsv(expenses, filePath);
    console.log(`✅ Exportados ${expenses.length} gastos a "${filePath}".`);
}

/**
 * Importa gastos desde un fichero CSV, ignorando duplicados por ID.
 *
 * Uso: --import-csv <ruta/archivo.csv>
 *
 * @param {string[]} subArgs
 * @throws {ArgumentError} Si no se proporciona la ruta del fichero.
 */
function cmdImportCsv(subArgs) {
    if (subArgs.length !== 1) {
        throw new ArgumentError(
            'Argumento inválido.',
            'Uso: node index.js --import-csv <archivo.csv>'
        );
    }

    const filePath = subArgs[0];
    const existing = readExpenses();
    const existingIds = new Set(existing.map(e => e.id));

    const { imported, duplicates } = importFromCsv(filePath, existingIds);

    writeExpenses([...existing, ...imported]);

    console.log(
        `✅ Importados ${imported.length} nuevos gastos desde "${filePath}". ` +
        `(${duplicates} duplicados ignorados)`
    );
}

module.exports = {
    cmdAdd,
    cmdSummary,
    cmdDelete,
    cmdList,
    cmdFilterByCategory,
    cmdFilterByMonth,
    cmdExportCsv,
    cmdImportCsv,
};
