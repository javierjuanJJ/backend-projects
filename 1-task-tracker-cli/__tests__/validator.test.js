/**
 * @file validator.test.js
 * @description Suite de tests unitarios para el módulo validator.
 *
 * Estrategia de aislamiento:
 *   - validator.js solo depende de constants (valores estáticos),
 *     por lo que NO necesita mocks de I/O. Los tests son puramente
 *     funcionales: entrada → excepción o no excepción.
 *
 * Funciones cubiertas:
 *   ✔ validateActionPresence — 2 casos (éxito, error)
 *   ✔ validateAction         — 2 casos (éxito, error)
 *   ✔ validateSubArgs        — por cada acción: éxito + error(es)
 *       · add              (2 casos)
 *       · update           (2 casos)
 *       · delete           (2 casos)
 *       · mark-in-progress (2 casos)
 *       · mark-done        (2 casos)
 *       · list             (3 casos: sin args, status válido, status inválido, demasiados args)
 */

const {
    validateActionPresence,
    validateAction,
    validateSubArgs,
} = require('../src/validator');

// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateActionPresence', () => {
// ═════════════════════════════════════════════════════════════════════════════

    // ── ÉXITO ─────────────────────────────────────────────────────────────────

    it('✔ ÉXITO — no lanza nada cuando hay al menos un argumento', () => {
        /**
         * Con al menos una cadena en el array la función debe
         * pasar sin lanzar ningún error.
         */
        expect(() => validateActionPresence(['add'])).not.toThrow();
    });

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error cuando el array de argumentos está vacío', () => {
        /**
         * Un CLI invocado sin argumentos debe producir un mensaje de
         * ayuda claro. Verificamos tanto el tipo como el contenido.
         */
        expect(() => validateActionPresence([])).toThrow('Pocos parámetros');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateAction', () => {
// ═════════════════════════════════════════════════════════════════════════════

    // ── ÉXITO ─────────────────────────────────────────────────────────────────

    it.each(['add', 'update', 'delete', 'mark-in-progress', 'mark-done', 'list'])(
        '✔ ÉXITO — "%s" es una acción válida y no lanza nada',
        (action) => {
            /**
             * Cada una de las 6 acciones permitidas debe pasar la validación.
             * Usamos it.each para no repetir el mismo test 6 veces.
             */
            expect(() => validateAction(action)).not.toThrow();
        }
    );

    // ── ERROR CONTROLADO ──────────────────────────────────────────────────────

    it('✘ ERROR — lanza Error con acción desconocida', () => {
        /**
         * Cualquier cadena que no esté en ALLOWED_ACTIONS debe provocar
         * un error que indique cuáles son las acciones válidas.
         */
        expect(() => validateAction('volar')).toThrow('Acción inválida: "volar"');
    });

    it('✘ ERROR — lanza Error con cadena vacía', () => {
        /** Un string vacío también es una acción inválida. */
        expect(() => validateAction('')).toThrow('Acción inválida');
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateSubArgs › acción "add"', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — acepta exactamente una descripción', () => {
        expect(() => validateSubArgs('add', ['Mi nueva tarea'])).not.toThrow();
    });

    it('✘ ERROR — lanza Error cuando no se pasa descripción (0 args)', () => {
        expect(() => validateSubArgs('add', [])).toThrow(
            'El comando "add" requiere exactamente una descripción.'
        );
    });

    it('✘ ERROR — lanza Error cuando se pasan demasiados argumentos (2+ args)', () => {
        /**
         * add solo admite una descripción; pasar dos argumentos es un error
         * de uso que el validador debe detectar.
         */
        expect(() => validateSubArgs('add', ['desc1', 'desc2'])).toThrow(
            'El comando "add" requiere exactamente una descripción.'
        );
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateSubArgs › acción "update"', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — acepta exactamente un ID y una nueva descripción', () => {
        expect(() => validateSubArgs('update', ['uuid-001', 'Nueva descripción'])).not.toThrow();
    });

    it('✘ ERROR — lanza Error cuando solo se pasa el ID (falta descripción)', () => {
        expect(() => validateSubArgs('update', ['uuid-001'])).toThrow(
            'El comando "update" requiere un ID y una nueva descripción.'
        );
    });

    it('✘ ERROR — lanza Error cuando no se pasa ningún argumento', () => {
        expect(() => validateSubArgs('update', [])).toThrow(
            'El comando "update" requiere un ID y una nueva descripción.'
        );
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateSubArgs › acción "delete"', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — acepta exactamente un ID', () => {
        expect(() => validateSubArgs('delete', ['uuid-001'])).not.toThrow();
    });

    it('✘ ERROR — lanza Error cuando no se proporciona ningún ID', () => {
        expect(() => validateSubArgs('delete', [])).toThrow(
            'El comando "delete" requiere exactamente un ID.'
        );
    });

    it('✘ ERROR — lanza Error cuando se pasan múltiples IDs', () => {
        expect(() => validateSubArgs('delete', ['uuid-001', 'uuid-002'])).toThrow(
            'El comando "delete" requiere exactamente un ID.'
        );
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateSubArgs › acción "mark-in-progress"', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — acepta exactamente un ID', () => {
        expect(() => validateSubArgs('mark-in-progress', ['uuid-001'])).not.toThrow();
    });

    it('✘ ERROR — lanza Error cuando no se proporciona ID', () => {
        expect(() => validateSubArgs('mark-in-progress', [])).toThrow(
            'El comando "mark-in-progress" requiere exactamente un ID.'
        );
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateSubArgs › acción "mark-done"', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — acepta exactamente un ID', () => {
        expect(() => validateSubArgs('mark-done', ['uuid-001'])).not.toThrow();
    });

    it('✘ ERROR — lanza Error cuando no se proporciona ID', () => {
        expect(() => validateSubArgs('mark-done', [])).toThrow(
            'El comando "mark-done" requiere exactamente un ID.'
        );
    });
});


// ═════════════════════════════════════════════════════════════════════════════
describe('validator › validateSubArgs › acción "list"', () => {
// ═════════════════════════════════════════════════════════════════════════════

    it('✔ ÉXITO — sin argumentos (lista todas las tareas)', () => {
        /** list sin filtro es un uso válido. */
        expect(() => validateSubArgs('list', [])).not.toThrow();
    });

    it.each(['todo', 'in-progress', 'done'])(
        '✔ ÉXITO — status válido "%s" no lanza nada',
        (status) => {
            expect(() => validateSubArgs('list', [status])).not.toThrow();
        }
    );

    it('✘ ERROR — lanza Error con status desconocido', () => {
        expect(() => validateSubArgs('list', ['volando'])).toThrow(
            'Status inválido: "volando".'
        );
    });

    it('✘ ERROR — lanza Error cuando se pasan dos o más argumentos', () => {
        /**
         * list admite como máximo un filtro de status; pasar dos
         * argumentos es ambiguo y debe rechazarse.
         */
        expect(() => validateSubArgs('list', ['todo', 'done'])).toThrow(
            'El comando "list" acepta como máximo un status.'
        );
    });
});
