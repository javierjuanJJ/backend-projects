// Leer argumentos
const args = process.argv.slice(2) // Solo argumentos relevantes

const allowedFilters = ['add', 'summary', 'delete', 'list', '--category', '--month', '--export-csv', '--import-csv']

if (args.length < 2) {
    console.error('❌ Pocos parámetros. Uso:\nnode app.js <directorio> ', allowedFilters)
    process.exit(1)
}

// Asignar parámetros
const actionParameter = args[0] ?? '.'

if (!allowedFilters.includes(actionParameter)) {
    console.error('❌ Filtro inválido. Usa: ', allowedFilters)
    process.exit(1)
}


const subArgs = process.argv.slice(3)
switch (key) {
    case 'add':

        if (subArgs.length === 1) {

        }
        else {
            console.error('❌ Solo se puede añadir una ID ')
            process.exit(1)
        }

        break;
    case 'summary':
        if (subArgs.length === 0) {

        }
        else {
            console.error('❌ Solo se puede eliminar una ID ')
            process.exit(1)
        }
        break;
    case 'delete':
        if (subArgs.length === 2 && subArgs[0] === '--id') {

        }
        else {
            console.error('❌ Solo se puede eliminar una ID ')
            process.exit(1)
        }
        break;
    case '--category':
        if (subArgs.length === 1) {

        }
        else {
            console.error('❌ Solo se puede marcar en progreso una ID ')
            process.exit(1)
        }
        break;
    case '--month':
        if (subArgs.length === 1) {

        }
        else {
            console.error('❌ Solo se puede marcar como hecho una ID ')
            process.exit(1)
        }
        break;

    case '--export-csv':
        if (subArgs.length === 1) {

        }
        else {
            console.error('❌ Solo se puede marcar como hecho una ID ')
            process.exit(1)
        }
        break;

    case '--import-csv':
        if (subArgs.length === 1) {

        }
        else {
            console.error('❌ Solo se puede marcar como hecho una ID ')
            process.exit(1)
        }
        break;
    case 'list':
        if (subArgs.length === 0) {

        }
        else {
            console.error('❌ Solo se listar un status ')
            process.exit(1)
        }
        break;

    default:
        break;
}

