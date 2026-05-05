/**
 * @file __tests__/formatter/eventFormatter.test.js
 * @description Tests unitarios para `formatter/eventFormatter.js`.
 *
 * El formateador es una función pura (sin efectos laterales ni I/O),
 * por lo que no necesitamos mocks: simplemente pasamos datos de entrada
 * y verificamos la salida.
 *
 * Casos cubiertos por describe:
 *
 *   formatEvents (función pública)
 *     ✅ Acierto  → array con eventos → devuelve líneas formateadas.
 *     ❌ Error    → array vacío       → devuelve mensaje de "sin actividad".
 *     ❌ Error    → valor no-array    → devuelve mensaje de "sin actividad".
 *
 *   Cada tipo de evento (integración a través de formatEvents):
 *     PushEvent      → singular/plural de commits, payload vacío.
 *     IssuesEvent    → acción "opened" vs otras acciones, payload vacío.
 *     WatchEvent     → caso único.
 *     ForkEvent      → caso único.
 *     PullRequestEvent → distintas acciones, payload vacío.
 *     CreateEvent    → distintos ref_type, payload vacío.
 *     Evento desconocido → fallback genérico.
 *     Repo ausente   → fallback "repositorio desconocido".
 */

import { formatEvents } from "../../formatter/eventFormatter.js";
import {
    makePushEvent,
    makeIssuesEvent,
    makeWatchEvent,
    makeForkEvent,
    makePullRequestEvent,
    makeCreateEvent,
    makeUnknownEvent,
} from "../fixtures/events.js";

// ─── formatEvents (función de entrada pública) ────────────────────────────────

describe("formatEvents", () => {
    // ── Acierto ───────────────────────────────────────────────────────────────

    describe("cuando recibe un array de eventos válido", () => {
        it("devuelve un array con la misma cantidad de líneas que eventos", () => {
            const events = [makePushEvent(), makeWatchEvent()];
            const result = formatEvents(events);
            expect(result).toHaveLength(2);
        });

        it("devuelve un array de strings", () => {
            const result = formatEvents([makePushEvent()]);
            result.forEach((line) => expect(typeof line).toBe("string"));
        });
    });

    // ── Error: entrada vacía o inválida ───────────────────────────────────────

    describe("cuando recibe un array vacío", () => {
        it("devuelve exactamente una línea", () => {
            expect(formatEvents([])).toHaveLength(1);
        });

        it("la línea indica que no hay actividad reciente", () => {
            const [line] = formatEvents([]);
            expect(line).toMatch(/no se encontró actividad/i);
        });
    });

    describe("cuando recibe null", () => {
        it("devuelve el mensaje de sin actividad en lugar de lanzar error", () => {
            const [line] = formatEvents(null);
            expect(line).toMatch(/no se encontró actividad/i);
        });
    });

    describe("cuando recibe undefined", () => {
        it("devuelve el mensaje de sin actividad en lugar de lanzar error", () => {
            const [line] = formatEvents(undefined);
            expect(line).toMatch(/no se encontró actividad/i);
        });
    });
});

// ─── PushEvent ────────────────────────────────────────────────────────────────

describe("formatEvents › PushEvent", () => {
    it("muestra el número correcto de commits (plural)", () => {
        const [line] = formatEvents([makePushEvent()]);
        // makePushEvent crea 2 commits por defecto
        expect(line).toBe("- Pushed 2 commits to user/repo");
    });

    it("usa singular cuando hay exactamente 1 commit", () => {
        const event = makePushEvent({ payload: { commits: [{}] } });
        const [line] = formatEvents([event]);
        expect(line).toBe("- Pushed 1 commit to user/repo");
    });

    it("muestra 0 commits cuando el payload no tiene la clave 'commits'", () => {
        const event = makePushEvent({ payload: {} });
        const [line] = formatEvents([event]);
        expect(line).toBe("- Pushed 0 commits to user/repo");
    });

    it("muestra 0 commits cuando el payload está completamente ausente", () => {
        const event = makePushEvent({ payload: undefined });
        const [line] = formatEvents([event]);
        expect(line).toBe("- Pushed 0 commits to user/repo");
    });
});

// ─── IssuesEvent ─────────────────────────────────────────────────────────────

describe("formatEvents › IssuesEvent", () => {
    it("usa el texto especial 'Opened a new issue' cuando la acción es 'opened'", () => {
        const [line] = formatEvents([makeIssuesEvent("opened")]);
        expect(line).toBe("- Opened a new issue in user/repo");
    });

    it("usa el texto genérico para la acción 'closed'", () => {
        const [line] = formatEvents([makeIssuesEvent("closed")]);
        expect(line).toBe("- closed an issue in user/repo");
    });

    it("usa el texto genérico para la acción 'reopened'", () => {
        const [line] = formatEvents([makeIssuesEvent("reopened")]);
        expect(line).toBe("- reopened an issue in user/repo");
    });

    it("usa el fallback cuando el payload no tiene 'action'", () => {
        const event = makeIssuesEvent("opened", { payload: {} });
        const [line] = formatEvents([event]);
        // action será "unknown action on" por defecto
        expect(line).toMatch(/an issue in user\/repo/);
    });
});

// ─── WatchEvent ───────────────────────────────────────────────────────────────

describe("formatEvents › WatchEvent", () => {
    it("indica que el usuario marcó el repositorio con estrella", () => {
        const [line] = formatEvents([makeWatchEvent()]);
        expect(line).toBe("- Starred user/repo");
    });
});

// ─── ForkEvent ────────────────────────────────────────────────────────────────

describe("formatEvents › ForkEvent", () => {
    it("indica que el usuario hizo fork del repositorio", () => {
        const [line] = formatEvents([makeForkEvent()]);
        expect(line).toBe("- Forked user/repo");
    });
});

// ─── PullRequestEvent ─────────────────────────────────────────────────────────

describe("formatEvents › PullRequestEvent", () => {
    it("incluye la acción 'opened' en el mensaje", () => {
        const [line] = formatEvents([makePullRequestEvent("opened")]);
        expect(line).toBe("- opened a pull request in user/repo");
    });

    it("incluye la acción 'closed' en el mensaje", () => {
        const [line] = formatEvents([makePullRequestEvent("closed")]);
        expect(line).toBe("- closed a pull request in user/repo");
    });

    it("usa el fallback cuando el payload no tiene 'action'", () => {
        const event = makePullRequestEvent("opened", { payload: {} });
        const [line] = formatEvents([event]);
        expect(line).toMatch(/a pull request in user\/repo/);
    });
});

// ─── CreateEvent ──────────────────────────────────────────────────────────────

describe("formatEvents › CreateEvent", () => {
    it("incluye 'branch' cuando el ref_type es branch", () => {
        const [line] = formatEvents([makeCreateEvent("branch")]);
        expect(line).toBe("- Created a new branch in user/repo");
    });

    it("incluye 'tag' cuando el ref_type es tag", () => {
        const [line] = formatEvents([makeCreateEvent("tag")]);
        expect(line).toBe("- Created a new tag in user/repo");
    });

    it("incluye 'repository' cuando el ref_type es repository", () => {
        const [line] = formatEvents([makeCreateEvent("repository")]);
        expect(line).toBe("- Created a new repository in user/repo");
    });

    it("usa 'resource' como fallback cuando el payload no tiene ref_type", () => {
        const event = makeCreateEvent("branch", { payload: {} });
        const [line] = formatEvents([event]);
        expect(line).toBe("- Created a new resource in user/repo");
    });
});

// ─── Evento de tipo desconocido ───────────────────────────────────────────────

describe("formatEvents › evento desconocido", () => {
    it("elimina el sufijo 'Event' y genera un mensaje genérico", () => {
        const [line] = formatEvents([makeUnknownEvent("DeleteEvent")]);
        expect(line).toBe("- Delete activity in user/repo");
    });

    it("funciona también con tipos inventados arbitrarios", () => {
        const [line] = formatEvents([makeUnknownEvent("MagicEvent")]);
        expect(line).toBe("- Magic activity in user/repo");
    });
});

// ─── Repositorio ausente ──────────────────────────────────────────────────────

describe("formatEvents › cuando el repo está ausente en el evento", () => {
    it("usa 'repositorio desconocido' como fallback para el nombre del repo", () => {
        const event = makePushEvent({ repo: undefined });
        const [line] = formatEvents([event]);
        expect(line).toContain("repositorio desconocido");
    });

    it("usa el fallback también cuando repo.name es undefined", () => {
        const event = makePushEvent({ repo: {} });
        const [line] = formatEvents([event]);
        expect(line).toContain("repositorio desconocido");
    });
});
