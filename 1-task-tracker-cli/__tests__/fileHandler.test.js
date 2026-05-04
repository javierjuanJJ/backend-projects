/**
 * @file fileHandler.test.js
 * @description Suite de tests unitarios para el módulo fileHandler.
 *
 * Estrategia de aislamiento:
 *   - Se mockea el módulo `fs` de Node.js con jest.mock() para evitar
 *     cualquier lectura/escritura real en disco durante los tests.
 *   - Se mockea `./constants` para controlar la ruta del archivo JSON.
 *   - Cada test configura el comportamiento de los mocks de forma
 *     independiente usando mockReturnValue / mockImplementation.
 *
 * Funciones cubiertas:
 *   ✔ readTasks  — 3 casos (éxito, JSON inválido, contenido no-array)
 *   ✔ writeTasks — 2 casos (éxito, fallo de escritura)
 */

// ─── Mocks de dependencias ────────────────────────────────────────────────────

/** Mockeamos `fs` completo para no tocar el sistema de archivos real */
jest.mock('fs');

/**
 * Mockeamos constants para que TASKS_FILE_PATH tenga un valor predecible
 * y no dependa del directorio de trabajo del proceso.
 */
jest.mock('../src/constants', () => ({
    TASKS_FILE_PATH: '/fake/path/tasks.json',
    ALLOWED_ACTIONS: ['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list'],
    VALID_STATUSES:  ['todo', 'in-progress', 'done'],
}));

// ─── Importaciones ────────────────────────────────────────────────────────────

const fs                    = require('fs');
const { readTasks, writeTasks } = require('../src/fileHandler');

// ─── Datos de prueba compartidos ──────────────────────────────────────────────

/** Tarea ficticia reutilizable en los tests */
const SAMPLE_TASK = {
    id:          'abc-123',
    description: 'Tarea de prueba',
    status:      'todo',
    createdAt:   '2024-01-01T00:00:00.000Z',
    updatedAt:   '2024-01-01T00:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════════
describe('fileHandler › readTasks', () => {
// ═════════════════════════════════════════════════════════════════════════════

    /**
     * Antes de cada test limpiamos todos los mocks para evitar
     * que el estado de uno afecte al siguiente.
     */
    beforeEach(() => jest.clearAllMocks());

    // ── ÉXITO ─────────────────────────────────────────────────────────────────

    it('✔ ÉXITO — retorna [] cuando el archivo no existe', () => {
        /**
         * Simulamos que existsSync dice que el archivo no existe.
         * En este caso readTasks debe devolver un array vacío sin
         * intentar leer nada.
         */
        fs.existsSync.mockReturnValue(false);

        const result = readTasks();

        expect(result).toEqual([]);
        // Verificamos que NO intentó leer el archivo
        expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('✔ ÉXITO — retorna el array de tareas cuando el JSON es válido', () => {
        /**
         * Simulamos que el archivo existe y contiene un JSON correcto
         * con una tarea. readTasks debe parsear y devolver esa tarea.
         */
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify([SAMPLE_TASK]));

        const result = readTasks();

        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ id: 'abc-123', description: 'Tarea de prueba' });
    });

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error si el archivo contiene JSON inválido', () => {
        /**
         * Simulamos un archivo corrupto con contenido que no es JSON.
         * readTasks debe capturarlo y relanzar como Error con mensaje claro.
         */
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('esto no es json {{{{');

        expect(() => readTasks()).toThrow('Error al leer tasks.json');
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — lanza Error si el JSON es válido pero no es un array', () => {
        /**
         * Un objeto JSON válido pero que no sea array es un estado de
         * corrupción lógica. readTasks debe detectarlo y lanzar un error
         * específico, ya que el resto del sistema espera siempre un array.
         */
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue(JSON.stringify({ clave: 'valor' }));

        expect(() => readTasks()).toThrow('El archivo de tareas no contiene un arreglo válido.');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('fileHandler › writeTasks', () => {
// ═════════════════════════════════════════════════════════════════════════════

    beforeEach(() => jest.clearAllMocks());

    // ── ÉXITO ─────────────────────────────────────────────────────────────────

    it('✔ ÉXITO — escribe el JSON correctamente en el archivo', () => {
        /**
         * writeFileSync no debe lanzar nada. Verificamos que se llamó
         * con la ruta correcta y con el contenido serializado como JSON.
         */
        fs.writeFileSync.mockImplementation(() => {}); // No hace nada, no lanza

        writeTasks([SAMPLE_TASK]);

        expect(fs.writeFileSync).toHaveBeenCalledWith(
            '/fake/path/tasks.json',
            JSON.stringify([SAMPLE_TASK], null, 2),
            'utf-8'
        );
    });

    // ── EXCEPCIÓN ─────────────────────────────────────────────────────────────

    it('⚠ EXCEPCIÓN — lanza Error si writeFileSync falla (p.ej. permisos)', () => {
        /**
         * Simulamos un fallo del sistema operativo al escribir (disco lleno,
         * sin permisos, etc.). writeTasks debe capturarlo y relanzar con
         * mensaje descriptivo.
         */
        fs.writeFileSync.mockImplementation(() => {
            throw new Error('EACCES: permission denied');
        });

        expect(() => writeTasks([SAMPLE_TASK])).toThrow('Error al escribir tasks.json');
    });
});
