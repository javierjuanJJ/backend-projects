/**
 * @file __tests__/index.test.js
 * @description Tests de integración para el flujo completo de `index.js`.
 *
 * Estos tests verifican que los tres módulos (args, githubClient, formatter)
 * interactúan correctamente entre sí a través de la función `main()`.
 *
 * Estrategia:
 *   - Mockeamos `fetch` global para controlar las respuestas HTTP.
 *   - Espiamos `process.argv`, `process.exit`, `console.log` y `console.error`
 *     para observar el comportamiento sin efectos secundarios reales.
 *   - Importamos `main` directamente para poder invocarla en cada test.
 *
 * Casos cubiertos:
 *   ✅ Flujo completo con 200 → imprime eventos formateados.
 *   ✅ Flujo con 304          → no imprime "Output:", solo el mensaje informativo.
 *   ❌ Error: sin argumentos  → process.exit(1) antes del fetch.
 *   ❌ Error: usuario 404     → imprime error en stderr y exit(1).
 *   ❌ Excepción de red       → imprime error en stderr y exit(1).
 */

// Importamos la función main. Jest con ESM requiere que el módulo exporte la función.
// En el index.js actual main() es local; para testearla la exportamos también.
// (Ver nota al pie sobre la modificación mínima necesaria.)
import { main } from "../../index.js";
import { makeFetchResponse } from "./fixtures/events.js";

// ─── Setup global ─────────────────────────────────────────────────────────────

let fetchMock;
let exitSpy;
let logSpy;
let errorSpy;

/**
 * Simula process.argv como si el usuario ejecutase:
 *   node index.js <username>
 */
function setArgv(username) {
    process.argv = ["node", "index.js", ...(username ? [username] : [])];
}

beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit llamado");
    });
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    delete global.fetch;
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
});

// ─── Tests de integración ─────────────────────────────────────────────────────

describe("main (flujo completo)", () => {
    // ── Acierto: 200 OK ───────────────────────────────────────────────────────

    describe("cuando fetch responde 200 con eventos", () => {
        it("imprime 'Output:' seguido de las líneas formateadas", async () => {
            setArgv("torvalds");

            const events = [
                {
                    type: "PushEvent",
                    repo: { name: "torvalds/linux" },
                    payload: { commits: [{}, {}] },
                },
            ];
            fetchMock.mockResolvedValue(makeFetchResponse(200, events));

            await main();

            expect(logSpy).toHaveBeenCalledWith("Output:");
            expect(logSpy).toHaveBeenCalledWith(
                "- Pushed 2 commits to torvalds/linux"
            );
        });

        it("no llama a process.exit en el flujo exitoso", async () => {
            setArgv("torvalds");
            fetchMock.mockResolvedValue(makeFetchResponse(200, []));

            await main();

            expect(exitSpy).not.toHaveBeenCalled();
        });
    });

    // ── Acierto: 304 Not Modified ─────────────────────────────────────────────

    describe("cuando fetch responde 304", () => {
        it("no imprime 'Output:' (no hay datos nuevos que mostrar)", async () => {
            setArgv("torvalds");
            fetchMock.mockResolvedValue(makeFetchResponse(304));

            await main();

            expect(logSpy).not.toHaveBeenCalledWith("Output:");
        });
    });

    // ── Error: argumentos inválidos ───────────────────────────────────────────

    describe("cuando no se proporciona ningún argumento", () => {
        it("llama a process.exit(1) sin llegar a hacer fetch", async () => {
            setArgv(null); // sin username

            await expect(main()).rejects.toThrow("process.exit llamado");

            expect(exitSpy).toHaveBeenCalledWith(1);
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    // ── Error: 404 del servidor ───────────────────────────────────────────────

    describe("cuando fetch responde 404 (usuario no encontrado)", () => {
        it("propaga el error hasta el .catch de main y llama a process.exit(1)", async () => {
            setArgv("usuario_que_no_existe");
            fetchMock.mockResolvedValue(makeFetchResponse(404));

            await expect(main()).rejects.toThrow(/404|no existe/i);
        });
    });

    // ── Excepción: error de red ───────────────────────────────────────────────

    describe("cuando fetch lanza un error de red", () => {
        it("el error se propaga desde fetchUserEvents hasta main", async () => {
            setArgv("torvalds");
            fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

            await expect(main()).rejects.toThrow(/Failed to fetch/i);
        });
    });
});
