/**
 * @file __tests__/cli/args.test.js
 * @description Tests unitarios para el módulo `cli/args.js`.
 *
 * Estrategia de prueba:
 * - `validateArgs` llama a `process.exit(1)` en caso de error, por lo que
 *   necesitamos espiarlo (jest.spyOn) para evitar que el proceso de test termine.
 * - También espiamos `console.error` para verificar los mensajes sin ensuciar
 *   la salida de la consola durante la ejecución de los tests.
 *
 * Casos cubiertos:
 *   ✅ Acierto  → un argumento válido no vacío → devuelve el username con trim().
 *   ❌ Error    → cero argumentos              → llama a process.exit(1).
 *   ❌ Error    → más de un argumento          → llama a process.exit(1).
 *   ❌ Error    → argumento vacío / solo espacios → llama a process.exit(1).
 */

import { validateArgs } from "../../cli/args.js";

// ─── Setup global de spies ────────────────────────────────────────────────────

/**
 * Antes de cada test:
 *   - Espiamos process.exit para que no mate el proceso de Jest.
 *   - Espiamos console.error para suprimir la salida y poder asertarla.
 */
let exitSpy;
let errorSpy;

beforeEach(() => {
    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
        // Lanzamos un error controlado para que el flujo se detenga
        // igual que lo haría un exit real, permitiendo al test capturarlo.
        throw new Error("process.exit llamado");
    });
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

/**
 * Después de cada test restauramos los spies para no afectar al resto.
 */
afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("validateArgs", () => {
    // ── Casos de acierto ──────────────────────────────────────────────────────

    describe("cuando recibe exactamente un argumento válido", () => {
        it("devuelve el nombre de usuario sin modificar", () => {
            const result = validateArgs(["torvalds"]);
            expect(result).toBe("torvalds");
        });

        it("elimina espacios en blanco alrededor del nombre (trim)", () => {
            // El usuario podría pasar '  torvalds  ' desde la shell con comillas
            const result = validateArgs(["  torvalds  "]);
            expect(result).toBe("torvalds");
        });

        it("no llama a process.exit cuando el argumento es válido", () => {
            validateArgs(["torvalds"]);
            expect(exitSpy).not.toHaveBeenCalled();
        });
    });

    // ── Casos de error: número incorrecto de argumentos ───────────────────────

    describe("cuando no se proporcionan argumentos", () => {
        it("llama a process.exit(1)", () => {
            expect(() => validateArgs([])).toThrow("process.exit llamado");
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it("imprime un mensaje de error descriptivo en console.error", () => {
            expect(() => validateArgs([])).toThrow();
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Uso correcto")
            );
        });
    });

    describe("cuando se proporcionan más de un argumento", () => {
        it("llama a process.exit(1)", () => {
            expect(() => validateArgs(["torvalds", "extra"])).toThrow(
                "process.exit llamado"
            );
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it("imprime un mensaje de error descriptivo en console.error", () => {
            expect(() => validateArgs(["torvalds", "extra"])).toThrow();
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Uso correcto")
            );
        });
    });

    // ── Casos de error: argumento vacío ──────────────────────────────────────

    describe("cuando el argumento es una cadena vacía", () => {
        it("llama a process.exit(1)", () => {
            expect(() => validateArgs([""])).toThrow("process.exit llamado");
            expect(exitSpy).toHaveBeenCalledWith(1);
        });

        it("imprime un mensaje sobre el nombre vacío", () => {
            expect(() => validateArgs([""])).toThrow();
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("no puede estar vacío")
            );
        });
    });

    describe("cuando el argumento son solo espacios en blanco", () => {
        it("llama a process.exit(1) porque tras trim() queda vacío", () => {
            expect(() => validateArgs(["   "])).toThrow("process.exit llamado");
            expect(exitSpy).toHaveBeenCalledWith(1);
        });
    });
});
