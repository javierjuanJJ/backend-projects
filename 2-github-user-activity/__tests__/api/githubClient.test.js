/**
 * @file __tests__/api/githubClient.test.js
 * @description Tests unitarios para `api/githubClient.js`.
 *
 * Estrategia de mocking:
 *   - `fetch` es una global en Node 18+. La reemplazamos con `jest.fn()` en
 *     `beforeEach` y la restauramos en `afterEach`.
 *   - No hacemos ninguna petición HTTP real: todos los tests son deterministas
 *     y se ejecutan sin red.
 *   - `console.log` se espía para verificar mensajes informativos (304)
 *     sin ensuciar la salida del test runner.
 *
 * Casos cubiertos:
 *
 *   fetchUserEvents
 *     ✅ Acierto     → HTTP 200 → devuelve el array de eventos.
 *     ✅ Acierto     → HTTP 304 → devuelve null y loguea mensaje informativo.
 *     ❌ Error HTTP  → HTTP 403 → lanza Error con mensaje del body.
 *     ❌ Error HTTP  → HTTP 403 sin body parseable → lanza Error con fallback.
 *     ❌ Error HTTP  → HTTP 404 → lanza Error indicando usuario inexistente.
 *     ❌ Error HTTP  → HTTP 503 → lanza Error de servicio no disponible.
 *     ❌ Error HTTP  → HTTP 500 → lanza Error genérico con el código de estado.
 *     ❌ Excepción   → error de red (fetch lanza) → lanza Error envuelto.
 *
 *   URL construida
 *     ✅ Verifica que fetch se llama con la URL correcta para el username dado.
 */

import { fetchUserEvents } from "../../api/githubClient.js";
import { makeFetchResponse } from "../fixtures/events.js";

// ─── Setup: mock de fetch ─────────────────────────────────────────────────────

let fetchMock;
let logSpy;

beforeEach(() => {
    // Reemplazamos la global `fetch` por un jest.fn() controlable
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    // Suprimimos console.log para no contaminar la salida
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
    delete global.fetch;
    logSpy.mockRestore();
    jest.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("fetchUserEvents", () => {
    // ── URL construida ────────────────────────────────────────────────────────

    describe("construcción de la URL de la petición", () => {
        it("llama a fetch con la URL correcta para el username dado", async () => {
            const events = [{ type: "PushEvent" }];
            fetchMock.mockResolvedValue(makeFetchResponse(200, events));

            await fetchUserEvents("torvalds");

            expect(fetchMock).toHaveBeenCalledWith(
                "https://api.github.com/users/torvalds/events",
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Accept: "application/vnd.github+json",
                    }),
                })
            );
        });
    });

    // ── HTTP 200: acierto ─────────────────────────────────────────────────────

    describe("cuando la API responde con HTTP 200", () => {
        it("devuelve el array de eventos parseado como JSON", async () => {
            const events = [{ type: "PushEvent", repo: { name: "user/repo" } }];
            fetchMock.mockResolvedValue(makeFetchResponse(200, events));

            const result = await fetchUserEvents("torvalds");

            expect(result).toEqual(events);
        });

        it("devuelve un array vacío si la API responde con [] (usuario sin actividad)", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(200, []));

            const result = await fetchUserEvents("torvalds");

            expect(result).toEqual([]);
        });
    });

    // ── HTTP 304: acierto silencioso ──────────────────────────────────────────

    describe("cuando la API responde con HTTP 304 (Not Modified)", () => {
        it("devuelve null", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(304));

            const result = await fetchUserEvents("torvalds");

            expect(result).toBeNull();
        });

        it("imprime un mensaje informativo en console.log", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(304));

            await fetchUserEvents("torvalds");

            expect(logSpy).toHaveBeenCalledWith(
                expect.stringContaining("304")
            );
        });
    });

    // ── HTTP 403: acceso denegado ─────────────────────────────────────────────

    describe("cuando la API responde con HTTP 403 (Forbidden)", () => {
        it("lanza un Error que incluye el mensaje del body de la respuesta", async () => {
            const body = { message: "API rate limit exceeded" };
            fetchMock.mockResolvedValue(makeFetchResponse(403, body));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "API rate limit exceeded"
            );
        });

        it("incluye '403 Forbidden' en el mensaje de error", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(403, { message: "Forbidden" }));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow("403 Forbidden");
        });

        it("usa el mensaje de fallback si el body no es JSON parseable", async () => {
            // Simulamos que .json() rechaza (body malformado)
            const badResponse = {
                status: 403,
                json: jest.fn().mockRejectedValue(new SyntaxError("Unexpected token")),
            };
            fetchMock.mockResolvedValue(badResponse);

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "Acceso denegado por GitHub."
            );
        });
    });

    // ── HTTP 404: usuario no encontrado ───────────────────────────────────────

    describe("cuando la API responde con HTTP 404 (Not Found)", () => {
        it("lanza un Error indicando que el usuario no existe", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(404));

            await expect(fetchUserEvents("usuario_inexistente")).rejects.toThrow(
                "404 Not Found"
            );
        });

        it("el mensaje menciona que el usuario no existe en GitHub", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(404));

            await expect(fetchUserEvents("usuario_inexistente")).rejects.toThrow(
                /no existe en GitHub/i
            );
        });
    });

    // ── HTTP 503: servicio no disponible ──────────────────────────────────────

    describe("cuando la API responde con HTTP 503 (Service Unavailable)", () => {
        it("lanza un Error indicando que la API no está disponible", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(503));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "503 Service Unavailable"
            );
        });

        it("el mensaje recomienda intentarlo más tarde", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(503));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                /inténtalo más tarde/i
            );
        });
    });

    // ── HTTP código inesperado ────────────────────────────────────────────────

    describe("cuando la API responde con un código HTTP no contemplado (ej. 500)", () => {
        it("lanza un Error genérico que incluye el código de estado", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(500));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "HTTP 500"
            );
        });

        it("también funciona con códigos como 429 (Too Many Requests)", async () => {
            fetchMock.mockResolvedValue(makeFetchResponse(429));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "HTTP 429"
            );
        });
    });

    // ── Excepción de red ──────────────────────────────────────────────────────

    describe("cuando fetch lanza una excepción de red", () => {
        it("lanza un Error que envuelve el error de red original", async () => {
            fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "Failed to fetch"
            );
        });

        it("el mensaje de error menciona que es un error de red con GitHub", async () => {
            fetchMock.mockRejectedValue(new TypeError("network timeout"));

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                /error de red al contactar GitHub/i
            );
        });

        it("también captura errores de DNS (ENOTFOUND)", async () => {
            const dnsError = new Error("getaddrinfo ENOTFOUND api.github.com");
            fetchMock.mockRejectedValue(dnsError);

            await expect(fetchUserEvents("torvalds")).rejects.toThrow(
                "ENOTFOUND"
            );
        });
    });
});
