const fs = require('fs');
const path = require('path');

const tasksPath = path.join(process.cwd(), 'tasks.json');

// Leer argumentos
const args = process.argv.slice(2) // Solo argumentos relevantes

const allowedFilters = ['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list']

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

        if (subArgs.length === 2) {
            const newTask = {
                id: crypto.randomUUID(),
                description: subArgs[1],
                status: "todo",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            let tasks = [];

            if (fs.existsSync(tasksPath)) {
                const fileContent = fs.readFileSync(tasksPath, 'utf-8');
                tasks = JSON.parse(fileContent);
            }

            tasks.push(newTask);

            fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');

            console.log('Task added:', newTask);


        }
        else {
            console.error('❌ Solo se puede añadir una ID ')
            process.exit(1)
        }

        break;
    case 'update':
        if (subArgs.length === 2) {
            const [id, newDescription] = subArgs;
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex === -1) {
                console.error('❌ No se encontró la tarea con ID:', id);
                process.exit(1);
            }
            tasks[taskIndex].description = newDescription;
            tasks[taskIndex].updatedAt = new Date().toISOString();
            fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
            console.log('✅ Tarea actualizada:', tasks[taskIndex]);
        }
        else {
            console.error('❌ Solo se puede eliminar una ID ')
            process.exit(1)
        }
        break;

    case 'delete':
        if (subArgs.length === 1) {
            const [id] = subArgs;
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex === -1) {
                console.error('❌ No se encontró la tarea con ID:', id);
                process.exit(1);
            }
            const deleted = tasks.splice(taskIndex, 1);
            fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
            console.log('✅ Tarea eliminada:', deleted[0]);
        }
        else {
            console.error('❌ Solo se puede eliminar una ID ')
            process.exit(1)
        }
        break;

    case 'mark-in-progress':
        if (subArgs.length === 1) {
            const [id] = subArgs;
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex === -1) {
                console.error('❌ No se encontró la tarea con ID:', id);
                process.exit(1);
            }
            tasks[taskIndex].status = 'in-progress';
            tasks[taskIndex].updatedAt = new Date().toISOString();
            fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
            console.log('✅ Tarea marcada en progreso:', tasks[taskIndex]);
        }
        else {
            console.error('❌ Solo se puede marcar en progreso una ID ')
            process.exit(1)
        }
        break;

    case 'mark-done':
        if (subArgs.length === 1) {
            const [id] = subArgs;
            const taskIndex = tasks.findIndex(t => t.id === id);
            if (taskIndex === -1) {
                console.error('❌ No se encontró la tarea con ID:', id);
                process.exit(1);
            }
            tasks[taskIndex].status = 'done';
            tasks[taskIndex].updatedAt = new Date().toISOString();
            fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
            console.log('✅ Tarea marcada como hecha:', tasks[taskIndex]);
        }
        else {
            console.error('❌ Solo se puede marcar como hecho una ID ')
            process.exit(1)
        }
        break;

    case 'list':
        if (subArgs.length === 1) {
            const [statusFilter] = subArgs;
            const validStatuses = ['todo', 'in-progress', 'done'];
            if (!validStatuses.includes(statusFilter)) {
                console.error('❌ Status no válido. Usa: todo, in-progress, done');
                process.exit(1);
            }
            const filtered = tasks.filter(t => t.status === statusFilter);
            if (filtered.length === 0) {
                console.log(`📋 No hay tareas con status "${statusFilter}"`);
            } else {
                console.log(`📋 Tareas con status "${statusFilter}":`);
                filtered.forEach(t => console.log(` - [${t.id}] ${t.description}`));
            }
        }
        else {
            console.error('❌ Solo se listar un status ')
            process.exit(1)
        }
        break;
    default:
        break;
}

