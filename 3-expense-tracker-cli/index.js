const fs = require('fs');
const path = require('path');

const expressesPath = path.join(process.cwd(), 'expresses.json');

// Leer argumentos
const args = process.argv.slice(2); // Solo argumentos relevantes

const allowedFilters = ['add', 'summary', 'delete', 'list', '--category', '--month', '--export-csv', '--import-csv'];

if (args.length < 1) {
    console.error('❌ Pocos parámetros. Uso:\nnode app.js <acción> ', allowedFilters);
    process.exit(1);
}

// Asignar parámetros
const actionParameter = args[0] ?? '.';

if (!allowedFilters.includes(actionParameter)) {
    console.error('❌ Filtro inválido. Usa: ', allowedFilters);
    process.exit(1);
}

// --- Helpers ---

function readExpenses() {
    if (fs.existsSync(expressesPath)) {
        const fileContent = fs.readFileSync(expressesPath, 'utf-8');
        return JSON.parse(fileContent);
    }
    return [];
}

function writeExpenses(expenses) {
    fs.writeFileSync(expressesPath, JSON.stringify(expenses, null, 2), 'utf-8');
}

function parseCsvLine(line) {
    return line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
}

// --- Switch ---

const key = actionParameter;
const subArgs = process.argv.slice(3);

switch (key) {
    case 'add':
        if (subArgs.length === 4 && subArgs[0] === '--description' && subArgs[2] === '--amount') {
            const description = subArgs[1];
            const amount = parseFloat(subArgs[3]);

            if (isNaN(amount)) {
                console.error('❌ El importe debe ser un número válido.');
                process.exit(1);
            }

            const newExpense = {
                id: crypto.randomUUID(),
                description: description,
                amount: amount,
                category: 'general',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const expenses = readExpenses();
            expenses.push(newExpense);
            writeExpenses(expenses);

            console.log('✅ Gasto añadido:', newExpense);

        } else if (subArgs.length === 6 && subArgs[0] === '--description' && subArgs[2] === '--amount' && subArgs[4] === '--category') {
            // Variante con categoría opcional al añadir
            const description = subArgs[1];
            const amount = parseFloat(subArgs[3]);
            const category = subArgs[5];

            if (isNaN(amount)) {
                console.error('❌ El importe debe ser un número válido.');
                process.exit(1);
            }

            const newExpense = {
                id: crypto.randomUUID(),
                description: description,
                amount: amount,
                category: category,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const expenses = readExpenses();
            expenses.push(newExpense);
            writeExpenses(expenses);

            console.log('✅ Gasto añadido:', newExpense);

        } else {
            console.error('❌ Uso: node app.js add --description <desc> --amount <importe> [--category <cat>]');
            process.exit(1);
        }
        break;

    case 'summary':
        if (subArgs.length === 0) {
            const expenses = readExpenses();

            if (expenses.length === 0) {
                console.log('📭 No hay gastos registrados.');
                break;
            }

            const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

            // Agrupar por categoría
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

        } else {
            console.error('❌ Uso: node app.js summary');
            process.exit(1);
        }
        break;

    case 'delete':
        if (subArgs.length === 2 && subArgs[0] === '--id') {
            const id = subArgs[1];
            const expenses = readExpenses();
            const index = expenses.findIndex(e => e.id === id);

            if (index === -1) {
                console.error(`❌ No se encontró ningún gasto con ID: ${id}`);
                process.exit(1);
            }

            const deleted = expenses.splice(index, 1)[0];
            writeExpenses(expenses);

            console.log('🗑️  Gasto eliminado:', deleted);

        } else {
            console.error('❌ Uso: node app.js delete --id <id>');
            process.exit(1);
        }
        break;

    case '--category':
        if (subArgs.length === 1) {
            const category = subArgs[0];
            const expenses = readExpenses();
            const filtered = expenses.filter(e => (e.category || 'general').toLowerCase() === category.toLowerCase());

            if (filtered.length === 0) {
                console.log(`📭 No hay gastos en la categoría "${category}".`);
                break;
            }

            const total = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            console.log(`\n📂 Gastos en categoría "${category}":`);
            console.log('─'.repeat(50));
            filtered.forEach(e => {
                console.log(`  [${e.id.slice(0, 8)}...] ${e.description} — ${parseFloat(e.amount).toFixed(2)} €  (${e.createdAt.slice(0, 10)})`);
            });
            console.log('─'.repeat(50));
            console.log(`  Total: ${total.toFixed(2)} €`);

        } else {
            console.error('❌ Uso: node app.js --category <categoría>');
            process.exit(1);
        }
        break;

    case '--month':
        if (subArgs.length === 1) {
            const month = parseInt(subArgs[0]);

            if (isNaN(month) || month < 1 || month > 12) {
                console.error('❌ El mes debe ser un número entre 1 y 12.');
                process.exit(1);
            }

            const expenses = readExpenses();
            const filtered = expenses.filter(e => {
                const expMonth = new Date(e.createdAt).getMonth() + 1;
                return expMonth === month;
            });

            if (filtered.length === 0) {
                console.log(`📭 No hay gastos en el mes ${month}.`);
                break;
            }

            const total = filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            const monthName = new Date(2000, month - 1).toLocaleString('es-ES', { month: 'long' });

            console.log(`\n📅 Gastos de ${monthName}:`);
            console.log('─'.repeat(50));
            filtered.forEach(e => {
                console.log(`  [${e.id.slice(0, 8)}...] ${e.description} — ${parseFloat(e.amount).toFixed(2)} €`);
            });
            console.log('─'.repeat(50));
            console.log(`  Total: ${total.toFixed(2)} €`);

        } else {
            console.error('❌ Uso: node app.js --month <1-12>');
            process.exit(1);
        }
        break;

    case '--export-csv':
        if (subArgs.length === 1) {
            const csvFile = subArgs[0];
            const expenses = readExpenses();

            if (expenses.length === 0) {
                console.log('📭 No hay gastos para exportar.');
                break;
            }

            const header = 'id,description,amount,category,createdAt,updatedAt';
            const rows = expenses.map(e =>
                `"${e.id}","${e.description}","${e.amount}","${e.category || 'general'}","${e.createdAt}","${e.updatedAt}"`
            );
            const csvContent = [header, ...rows].join('\n');

            fs.writeFileSync(csvFile, csvContent, 'utf-8');
            console.log(`✅ Exportados ${expenses.length} gastos a "${csvFile}".`);

        } else {
            console.error('❌ Uso: node app.js --export-csv <archivo.csv>');
            process.exit(1);
        }
        break;

    case '--import-csv':
        if (subArgs.length === 1) {
            const csvFile = subArgs[0];

            if (!fs.existsSync(csvFile)) {
                console.error(`❌ No se encontró el archivo: ${csvFile}`);
                process.exit(1);
            }

            const csvContent = fs.readFileSync(csvFile, 'utf-8');
            const lines = csvContent.split('\n').filter(l => l.trim() !== '');

            // Saltar cabecera
            const dataLines = lines.slice(1);
            const imported = dataLines.map(line => {
                const [id, description, amount, category, createdAt, updatedAt] = parseCsvLine(line);
                return {
                    id: id || crypto.randomUUID(),
                    description,
                    amount: parseFloat(amount),
                    category: category || 'general',
                    createdAt: createdAt || new Date().toISOString(),
                    updatedAt: updatedAt || new Date().toISOString()
                };
            });

            const existing = readExpenses();
            const existingIds = new Set(existing.map(e => e.id));
            const newOnes = imported.filter(e => !existingIds.has(e.id));

            writeExpenses([...existing, ...newOnes]);
            console.log(`✅ Importados ${newOnes.length} nuevos gastos desde "${csvFile}". (${imported.length - newOnes.length} duplicados ignorados)`);

        } else {
            console.error('❌ Uso: node app.js --import-csv <archivo.csv>');
            process.exit(1);
        }
        break;

    case 'list':
        if (subArgs.length === 0) {
            const expenses = readExpenses();

            if (expenses.length === 0) {
                console.log('📭 No hay gastos registrados.');
                break;
            }

            console.log('\n📋 Lista de gastos:');
            console.log('─'.repeat(70));
            console.log('  ID (corto)   Descripción                  Importe     Categoría');
            console.log('─'.repeat(70));
            expenses.forEach(e => {
                const shortId = e.id.slice(0, 8) + '...';
                const desc = e.description.padEnd(28).slice(0, 28);
                const amount = `${parseFloat(e.amount).toFixed(2)} €`.padStart(10);
                const cat = e.category || 'general';
                console.log(`  ${shortId}  ${desc}  ${amount}  ${cat}`);
            });
            console.log('─'.repeat(70));
            const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
            console.log(`  Total: ${total.toFixed(2)} €`);

        } else {
            console.error('❌ Uso: node app.js list');
            process.exit(1);
        }
        break;

    default:
        break;
}