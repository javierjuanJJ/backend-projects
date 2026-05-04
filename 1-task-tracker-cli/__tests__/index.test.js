/**
 * @file index.test.js
 * @description Suite de tests de integración para el punto de entrada CLI (index.js).
 *
 * Estrategia de aislamiento:
 *   - Se usa jest.isolateModules() para recargar index.js en cada test
 *     con un registro de módulos completamente limpio, garantizando que
 *     process.argv sea leído de nuevo en cada ejecución.
 *   - Dentro de cada bloque isolateModules, se re-requieren los mocks con
 *     jest.requireMock() para obtener las referencias vivas (las mismas
 *     que index.js utilizará al cargarse).
 *   - process.argv se sobreescribe antes de cada require('../src/index').
 *   - process.exit se mockea con jest.spyOn para evitar que los tests
 *     terminen el proceso de Jest y poder verificar el código de salida.
 *   - console.error y console.log se silencian para mantener la salida limpia.
 *
 * Lo que se testea aquí (responsabilidad exclusiva de index.js):
 *   ✔ Parseo correcto de process.argv → action y subArgs
 *   ✔ Delegación a la función correcta de taskManager según la acción
 *   ✔ Paso correcto de subArgs a cada función de negocio
 *   ✔ Manejo centralizado de errores: console.error + process.exit(1)
 *   ✔ Cada una de las 6 ramas del switch — éxito y error
 *   ✔ Casos límite: acción inválida, sin argumentos, error de I/O
 */

// ─── Declaración de mocks (deben ir antes de los imports) ─────────────────────

jest.mock('../src/validator');
jest.mock('../src/taskManager');
jest.mock('../src/constants', () => ({
    TASKS_FILE_PATH: '/fake/path/tasks.json',
    ALLOWED_ACTIONS: ['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list'],
    VALID_STATUSES:  ['todo', 'in-progress', 'done'],
}));

// ─── Configuración global de spies ───────────────────────────────────────────

let exitSpy;

beforeEach(() => {
    jest.clearAllMocks();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

// ─── Helper central ───────────────────────────────────────────────────────────

/**
 * Ejecuta index.js con los argumentos indicados usando jest.isolateModules,
 * que garantiza un registro de módulos limpio por cada invocación.
 * Devuelve las referencias vivas a los mocks para que los tests puedan
 * inspeccionarlas después de la ejecución.
 *
 * @param {string[]} args           - Argumentos CLI (sin 'node' ni ruta del script).
 * @param {Function} [setupMocks]   - Callback opcional para configurar los mocks
 *                                    antes de que index.js se ejecute. Recibe
 *                                    { validator, taskManager } ya mockeados.
 * @returns {{ validator: object, taskManager: object }}
 */
function runCLI(args, setupMocks) {
    let validator;
    let taskManager;

    jest.isolateModules(() => {
        validator   = jest.requireMock('../src/validator');
        taskManager = jest.requireMock('../src/taskManager');

        // Comportamiento por defecto: todo pasa sin lanzar
        validator.validateActionPresence.mockImplementation(() => {});
        validator.validateAction.mockImplementation(() => {});
        validator.validateSubArgs.mockImplementation(() => {});

        taskManager.addTask.mockReturnValue({ id: 'x', description: 'test', status: 'todo' });
        taskManager.updateTask.mockReturnValue({ id: 'x', description: 'updated', status: 'todo' });
        taskManager.deleteTask.mockReturnValue({ id: 'x', description: 'deleted', status: 'todo' });
        taskManager.markInProgress.mockReturnValue({ id: 'x', status: 'in-progress' });
        taskManager.markDone.mockReturnValue({ id: 'x', status: 'done' });
        taskManager.listTasks.mockReturnValue([]);

        // Permitir al test sobreescribir cualquier mock antes de ejecutar
        if (setupMocks) setupMocks({ validator, taskManager });

        process.argv = ['node', 'index.js', ...args];
        require('../src/index');
    });

    return { validator, taskManager };
}


// =============================================================================
describe('index › acción "add"', () => {
// =============================================================================

    it('✔ ÉXITO — llama a addTask con la descripción correcta', () => {
        /**
         * Al invocar `node index.js add "Mi tarea"`, index.js debe
         * extraer subArgs[0] = "Mi tarea" y pasarlo a addTask exactamente.
         */
        const { taskManager } = runCLI(['add', 'Mi tarea']);

        expect(taskManager.addTask).toHaveBeenCalledTimes(1);
        expect(taskManager.addTask).toHaveBeenCalledWith('Mi tarea');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✘ ERROR — exit(1) si el validador rechaza los subArgs', () => {
        /**
         * Cuando validateSubArgs lanza (add sin descripción), index.js debe
         * capturarlo, mostrarlo con console.error y salir con código 1.
         * addTask nunca debe llamarse.
         */
        const { taskManager } = runCLI(['add'], ({ validator }) => {
            validator.validateSubArgs.mockImplementation(() => {
                throw new Error('El comando "add" requiere exactamente una descripción.');
            });
        });

        expect(taskManager.addTask).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('El comando "add" requiere exactamente una descripción.')
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('⚠ EXCEPCIÓN — exit(1) si addTask lanza un error de I/O inesperado', () => {
        /**
         * Aunque el validador pase, addTask puede fallar por causas del sistema
         * (disco lleno, permisos). index.js debe manejarlo igualmente.
         */
        runCLI(['add', 'Tarea con disco lleno'], ({ taskManager }) => {
            taskManager.addTask.mockImplementation(() => {
                throw new Error('Error al escribir tasks.json: ENOSPC device full');
            });
        });

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error al escribir tasks.json: ENOSPC device full')
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});


// =============================================================================
describe('index › acción "update"', () => {
// =============================================================================

    it('✔ ÉXITO — llama a updateTask con el ID y la nueva descripción', () => {
        const { taskManager } = runCLI(['update', 'uuid-001', 'Descripción actualizada']);

        expect(taskManager.updateTask).toHaveBeenCalledTimes(1);
        expect(taskManager.updateTask).toHaveBeenCalledWith('uuid-001', 'Descripción actualizada');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✘ ERROR — exit(1) si updateTask lanza Error (ID no encontrado)', () => {
        runCLI(['update', 'uuid-001', 'Nueva desc'], ({ taskManager }) => {
            taskManager.updateTask.mockImplementation(() => {
                throw new Error('No se encontró ninguna tarea con el ID: uuid-001');
            });
        });

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('No se encontró ninguna tarea con el ID: uuid-001')
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('✘ ERROR — exit(1) si el validador rechaza update sin descripción', () => {
        const { taskManager } = runCLI(['update', 'uuid-001'], ({ validator }) => {
            validator.validateSubArgs.mockImplementation(() => {
                throw new Error('El comando "update" requiere un ID y una nueva descripción.');
            });
        });

        expect(taskManager.updateTask).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});


// =============================================================================
describe('index › acción "delete"', () => {
// =============================================================================

    it('✔ ÉXITO — llama a deleteTask con el ID correcto', () => {
        const { taskManager } = runCLI(['delete', 'uuid-002']);

        expect(taskManager.deleteTask).toHaveBeenCalledTimes(1);
        expect(taskManager.deleteTask).toHaveBeenCalledWith('uuid-002');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✘ ERROR — exit(1) si deleteTask lanza Error (ID no encontrado)', () => {
        runCLI(['delete', 'uuid-002'], ({ taskManager }) => {
            taskManager.deleteTask.mockImplementation(() => {
                throw new Error('No se encontró ninguna tarea con el ID: uuid-002');
            });
        });

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('No se encontró ninguna tarea con el ID: uuid-002')
        );
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('✘ ERROR — exit(1) si el validador rechaza delete sin ID', () => {
        const { taskManager } = runCLI(['delete'], ({ validator }) => {
            validator.validateSubArgs.mockImplementation(() => {
                throw new Error('El comando "delete" requiere exactamente un ID.');
            });
        });

        expect(taskManager.deleteTask).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});


// =============================================================================
describe('index › acción "mark-in-progress"', () => {
// =============================================================================

    it('✔ ÉXITO — llama a markInProgress con el ID correcto', () => {
        const { taskManager } = runCLI(['mark-in-progress', 'uuid-003']);

        expect(taskManager.markInProgress).toHaveBeenCalledTimes(1);
        expect(taskManager.markInProgress).toHaveBeenCalledWith('uuid-003');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✘ ERROR — exit(1) si markInProgress lanza Error (ID no encontrado)', () => {
        runCLI(['mark-in-progress', 'uuid-003'], ({ taskManager }) => {
            taskManager.markInProgress.mockImplementation(() => {
                throw new Error('No se encontró ninguna tarea con el ID: uuid-003');
            });
        });

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('No se encontró ninguna tarea con el ID: uuid-003')
        );
    });

    it('✘ ERROR — exit(1) si el validador rechaza mark-in-progress sin ID', () => {
        const { taskManager } = runCLI(['mark-in-progress'], ({ validator }) => {
            validator.validateSubArgs.mockImplementation(() => {
                throw new Error('El comando "mark-in-progress" requiere exactamente un ID.');
            });
        });

        expect(taskManager.markInProgress).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});


// =============================================================================
describe('index › acción "mark-done"', () => {
// =============================================================================

    it('✔ ÉXITO — llama a markDone con el ID correcto', () => {
        const { taskManager } = runCLI(['mark-done', 'uuid-004']);

        expect(taskManager.markDone).toHaveBeenCalledTimes(1);
        expect(taskManager.markDone).toHaveBeenCalledWith('uuid-004');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✘ ERROR — exit(1) si markDone lanza Error (ID no encontrado)', () => {
        runCLI(['mark-done', 'uuid-004'], ({ taskManager }) => {
            taskManager.markDone.mockImplementation(() => {
                throw new Error('No se encontró ninguna tarea con el ID: uuid-004');
            });
        });

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('No se encontró ninguna tarea con el ID: uuid-004')
        );
    });

    it('✘ ERROR — exit(1) si el validador rechaza mark-done sin ID', () => {
        const { taskManager } = runCLI(['mark-done'], ({ validator }) => {
            validator.validateSubArgs.mockImplementation(() => {
                throw new Error('El comando "mark-done" requiere exactamente un ID.');
            });
        });

        expect(taskManager.markDone).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});


// =============================================================================
describe('index › acción "list"', () => {
// =============================================================================

    it('✔ ÉXITO — sin filtro llama a listTasks con null', () => {
        /**
         * `node index.js list` sin segundo argumento debe pasar null
         * a listTasks para que devuelva todas las tareas.
         */
        const { taskManager } = runCLI(['list']);

        expect(taskManager.listTasks).toHaveBeenCalledTimes(1);
        expect(taskManager.listTasks).toHaveBeenCalledWith(null);
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✔ ÉXITO — con filtro llama a listTasks con el status indicado', () => {
        const { taskManager } = runCLI(['list', 'done']);

        expect(taskManager.listTasks).toHaveBeenCalledWith('done');
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('✘ ERROR — exit(1) si el validador rechaza el status inválido', () => {
        const { taskManager } = runCLI(['list', 'volando'], ({ validator }) => {
            validator.validateSubArgs.mockImplementation(() => {
                throw new Error('Status inválido: "volando".');
            });
        });

        expect(taskManager.listTasks).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Status inválido: "volando".')
        );
    });
});


// =============================================================================
describe('index › manejo centralizado de errores', () => {
// =============================================================================

    it('✘ ERROR — acción inválida provoca exit(1) con mensaje descriptivo', () => {
        /**
         * validateAction detecta la acción inválida y lanza el error antes
         * de llegar al switch. El try/catch de index.js debe capturarlo.
         */
        runCLI(['volar'], ({ validator }) => {
            validator.validateAction.mockImplementation(() => {
                throw new Error('Acción inválida: "volar".');
            });
        });

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Acción inválida: "volar".')
        );
    });

    it('✘ ERROR — sin argumentos provoca exit(1) con mensaje de ayuda', () => {
        /**
         * validateActionPresence lanza cuando no hay ningún argumento.
         * El try/catch de index.js debe capturarlo antes de llegar al switch.
         */
        runCLI([], ({ validator }) => {
            validator.validateActionPresence.mockImplementation(() => {
                throw new Error('Pocos parámetros. Uso:\n  node index.js <acción> [...args]');
            });
        });

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Pocos parámetros')
        );
    });

    it('⚠ EXCEPCIÓN — cualquier error inesperado también termina con exit(1)', () => {
        /**
         * Un error completamente inesperado (ENOSPC, EACCES, fallo de red...)
         * que escale hasta index.js debe ser capturado por el try/catch global
         * y terminar con exit(1), nunca con un crash sin gestionar.
         */
        runCLI(['add', 'Tarea'], ({ taskManager }) => {
            taskManager.addTask.mockImplementation(() => {
                throw new Error('Error al escribir tasks.json: ENOSPC device full');
            });
        });

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('Error al escribir tasks.json: ENOSPC device full')
        );
    });
});
