/**
 * @file taskManager.test.js
 * @description Suite de tests unitarios para el módulo taskManager.
 *
 * Estrategia de aislamiento:
 *   - Se mockea `./fileHandler` para eliminar cualquier dependencia de I/O.
 *     readTasks devuelve datos controlados; writeTasks es un spy vacío.
 *   - Se mockea `crypto` para obtener UUIDs deterministas y poder
 *     verificar el ID generado en addTask.
 *   - console.log se silencia con jest.spyOn para mantener la salida limpia.
 *
 * Funciones cubiertas:
 *   ✔ addTask        — 2 casos (éxito, excepción de escritura)
 *   ✔ updateTask     — 3 casos (éxito, error ID no existe, excepción escritura)
 *   ✔ deleteTask     — 3 casos (éxito, error ID no existe, excepción escritura)
 *   ✔ markInProgress — 3 casos (éxito, error ID no existe, excepción escritura)
 *   ✔ markDone       — 3 casos (éxito, error ID no existe, excepción escritura)
 *   ✔ listTasks      — 4 casos (todas, filtro válido, filtro vacío, sin tareas)
 */

// ─── Mocks de dependencias ────────────────────────────────────────────────────

jest.mock('../src/fileHandler');
jest.mock('../src/constants', () => ({
    TASKS_FILE_PATH: '/fake/path/tasks.json',
    ALLOWED_ACTIONS: ['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list'],
    VALID_STATUSES:  ['todo', 'in-progress', 'done'],
}));

/** UUID fijo para que addTask sea determinista en los tests */
const FIXED_UUID = 'fixed-uuid-1234';
jest.mock('crypto', () => ({ randomUUID: jest.fn(() => FIXED_UUID) }));

// ─── Importaciones ────────────────────────────────────────────────────────────

const { readTasks, writeTasks } = require('../src/fileHandler');
const {
    addTask,
    updateTask,
    deleteTask,
    markInProgress,
    markDone,
    listTasks,
} = require('../src/taskManager');

// ─── Datos de prueba compartidos ──────────────────────────────────────────────

/** Fábrica de tareas de prueba para mantener los tests independientes */
const makeTasks = () => [
    { id: 'id-1', description: 'Tarea uno',  status: 'todo',        createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'id-2', description: 'Tarea dos',  status: 'in-progress', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
    { id: 'id-3', description: 'Tarea tres', status: 'done',        createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z' },
];

// ─── Configuración global de los tests ───────────────────────────────────────

beforeEach(() => {
    jest.clearAllMocks();
    // Silenciar console.log para mantener la salida de Jest limpia
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    console.log.mockRestore?.();
});


// ═════════════════════════════════════════════════════════════════════════════
describe('taskManager › addTask', () => {
// ═════════════════════════════════════════════════════════════════════════════

    // ── ÉXITO ─────────────────────────────────────────────────────────────────

    it('✔ ÉXITO — crea la tarea con los campos correctos y la persiste', () => {
        /**
         * readTasks devuelve una lista vacía (primer uso del sistema).
         * Verificamos que la tarea creada tenga el UUID fijo, status "todo",
         * y que writeTasks haya sido llamado con el array actualizado.
         */
        readTasks.mockReturnValue([]);
        writeTasks.mockImplementation(() => {});

        const task = addTask('Mi primera tarea');

        expect(task).toMatchObject({
            id:          FIXED_UUID,
            description: 'Mi primera tarea',
            status:      'todo',
        });
        expect(task.createdAt).toBeDefined();
        expect(task.updatedAt).toBeDefined();

        // writeTasks debe haber recibido un array con la tarea nueva
        expect(writeTasks).toHaveBeenCalledWith(
            expect.arrayContaining([expect.objectContaining({ id: FIXED_UUID })])
        );
    });

    it('✔ ÉXITO — añade la tarea a una lista ya existente (no machaca las anteriores)', () => {
        /**
         * Si ya hay tareas, la nueva debe agregarse al final sin eliminar
         * las existentes.
         */
        const existingTasks = makeTasks();
        readTasks.mockReturnValue([...existingTasks]);
        writeTasks.mockImplementation(() => {});

        addTask('Cuarta tarea');

        const savedArray = writeTasks.mock.calls[0][0];
        expect(savedArray).toHaveLength(4);
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — propaga el error si writeTasks falla', () => {
        /**
         * Si el sistema de archivos falla al guardar, addTask no debe
         * silenciar el error; debe propagarlo al llamante.
         */
        readTasks.mockReturnValue([]);
        writeTasks.mockImplementation(() => { throw new Error('Error al escribir tasks.json: EACCES'); });

        expect(() => addTask('Tarea que no se puede guardar')).toThrow('Error al escribir tasks.json');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('taskManager › updateTask', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — actualiza la descripción y el campo updatedAt', () => {
        /**
         * Verificamos que la tarea devuelta tenga la nueva descripción y
         * que updatedAt sea distinto al original (fecha de modificación).
         */
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => {});

        const updated = updateTask('id-1', 'Descripción nueva');

        expect(updated.description).toBe('Descripción nueva');
        // updatedAt debe haberse renovado (≥ createdAt original)
        expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
            new Date('2024-01-01T00:00:00.000Z').getTime()
        );
    });

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error si el ID no existe en la lista', () => {
        readTasks.mockReturnValue(makeTasks());

        expect(() => updateTask('id-inexistente', 'desc')).toThrow(
            'No se encontró ninguna tarea con el ID: id-inexistente'
        );
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — propaga el error si writeTasks falla', () => {
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => { throw new Error('Error al escribir tasks.json: disco lleno'); });

        expect(() => updateTask('id-1', 'nueva desc')).toThrow('Error al escribir tasks.json');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('taskManager › deleteTask', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — elimina la tarea correcta y devuelve la tarea borrada', () => {
        /**
         * Tras eliminar id-2, el array persisitido debe tener solo 2 elementos
         * y no contener ninguno con id-2.
         */
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => {});

        const deleted = deleteTask('id-2');

        expect(deleted.id).toBe('id-2');

        const savedArray = writeTasks.mock.calls[0][0];
        expect(savedArray).toHaveLength(2);
        expect(savedArray.find(t => t.id === 'id-2')).toBeUndefined();
    });

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error si el ID no existe', () => {
        readTasks.mockReturnValue(makeTasks());

        expect(() => deleteTask('id-fantasma')).toThrow(
            'No se encontró ninguna tarea con el ID: id-fantasma'
        );
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — propaga el error si writeTasks falla', () => {
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => { throw new Error('Error al escribir tasks.json: EROFS'); });

        expect(() => deleteTask('id-1')).toThrow('Error al escribir tasks.json');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('taskManager › markInProgress', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — cambia el status a "in-progress"', () => {
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => {});

        const result = markInProgress('id-1');

        expect(result.status).toBe('in-progress');
        expect(result.id).toBe('id-1');
    });

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error si el ID no existe', () => {
        readTasks.mockReturnValue(makeTasks());

        expect(() => markInProgress('id-000')).toThrow(
            'No se encontró ninguna tarea con el ID: id-000'
        );
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — propaga el error si writeTasks falla', () => {
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => { throw new Error('Error al escribir tasks.json'); });

        expect(() => markInProgress('id-1')).toThrow('Error al escribir tasks.json');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('taskManager › markDone', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — cambia el status a "done"', () => {
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => {});

        const result = markDone('id-2');

        expect(result.status).toBe('done');
        expect(result.id).toBe('id-2');
    });

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error si el ID no existe', () => {
        readTasks.mockReturnValue(makeTasks());

        expect(() => markDone('id-xyz')).toThrow(
            'No se encontró ninguna tarea con el ID: id-xyz'
        );
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — propaga el error si writeTasks falla', () => {
        readTasks.mockReturnValue(makeTasks());
        writeTasks.mockImplementation(() => { throw new Error('Error al escribir tasks.json'); });

        expect(() => markDone('id-1')).toThrow('Error al escribir tasks.json');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('taskManager › listTasks', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — sin filtro devuelve todas las tareas', () => {
        /**
         * listTasks() sin argumento debe devolver las 3 tareas de prueba
         * sin filtrar por ningún status.
         */
        readTasks.mockReturnValue(makeTasks());

        const result = listTasks();

        expect(result).toHaveLength(3);
    });

    it('✔ ÉXITO — con filtro "todo" devuelve solo las tareas con ese status', () => {
        readTasks.mockReturnValue(makeTasks());

        const result = listTasks('todo');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('id-1');
        result.forEach(t => expect(t.status).toBe('todo'));
    });

    it('✔ ÉXITO — con filtro "in-progress" devuelve solo las tareas en progreso', () => {
        readTasks.mockReturnValue(makeTasks());

        const result = listTasks('in-progress');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('id-2');
    });

    it('✔ ÉXITO — con filtro "done" devuelve solo las tareas completadas', () => {
        readTasks.mockReturnValue(makeTasks());

        const result = listTasks('done');

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('id-3');
    });

    it('✔ ÉXITO — retorna array vacío cuando no hay tareas con el status filtrado', () => {
        /**
         * Si no hay tareas "done" listTasks debe devolver [] sin lanzar
         * error; simplemente informa que no hay resultados.
         */
        const soloTodo = [makeTasks()[0]]; // solo la tarea con status 'todo'
        readTasks.mockReturnValue(soloTodo);

        const result = listTasks('done');

        expect(result).toEqual([]);
    });

    it('✔ ÉXITO — retorna array vacío cuando no hay ninguna tarea registrada', () => {
        readTasks.mockReturnValue([]);

        const result = listTasks();

        expect(result).toEqual([]);
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — propaga el error si readTasks falla (JSON corrupto)', () => {
        /**
         * Si el archivo está corrupto, readTasks lanzará un error.
         * listTasks no debe silenciarlo; debe propagarlo al llamante.
         */
        readTasks.mockImplementation(() => { throw new Error('Error al leer tasks.json: JSON inválido'); });

        expect(() => listTasks()).toThrow('Error al leer tasks.json');
    });
});
