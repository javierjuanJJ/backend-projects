#!/usr/bin/env node

/**
 * @file index.js
 * @description Punto de entrada del CLI de GitHub Trending.
 *              Orquesta el flujo completo: parseo → validación → fetch → presentación.
 *              Todas las excepciones son capturadas aquí y tratadas
 *              de forma diferenciada según su tipo (instanceof).
 *
 * Uso:
 *   node index.js
 *   node index.js --duration week --limit 10
 *   node index.js --duration month --limit 25
 *   node index.js --duration day --limit 5
 *   node index.js --duration year --limit 50
 */

const { ParseError, ValidationError,
        NetworkError, ApiError }    = require('./errors');
const { parseArgs }                 = require('./parser');
const { validateParams }            = require('./validator');
const { fetchTrendingRepos }        = require('./githubClient');
const { printSearching, printRepos } = require('./presenter');

// ─────────────────────────────────────────────
//  Punto de entrada
// ─────────────────────────────────────────────

(async () => {
    const rawArgs = process.argv.slice(2);

    try {
        // 1. Parsear los flags --key value
        const parsed = parseArgs(rawArgs);

        // 2. Validar y normalizar los parámetros (aplica defaults)
        const { duration, limit } = validateParams(parsed);

        // 3. Informar al usuario de la búsqueda en curso
        printSearching(limit, duration);

        // 4. Consultar la GitHub Search API
        const repos = await fetchTrendingRepos(duration, limit);

        // 5. Mostrar los resultados
        printRepos(repos, duration);

    } catch (err) {

        // ── Error de formato de argumentos ────────
        if (err instanceof ParseError) {
            console.error(`\n🔴 Error de formato en los argumentos`);
            console.error(`   ${err.message}`);
            console.error(`\n   Uso correcto:`);
            console.error(`   node index.js [--duration day|week|month|year] [--limit N]\n`);
            process.exit(1);
        }

        // ── Error de validación de parámetros ─────
        if (err instanceof ValidationError) {
            console.error(`\n🟠 Parámetro inválido: --${err.param}`);
            console.error(`   ${err.message}`);
            console.error(`\n   Consulta los valores permitidos con --help.\n`);
            process.exit(1);
        }

        // ── Error de red / conectividad ───────────
        if (err instanceof NetworkError) {
            console.error(`\n🔵 Error de conexión`);
            console.error(`   ${err.message}`);
            if (err.cause) {
                console.error(`   Causa técnica: ${err.cause.message}`);
            }
            console.error(`\n   Verifica tu conexión a Internet e inténtalo de nuevo.\n`);
            process.exit(1);
        }

        // ── Error devuelto por la API de GitHub ───
        if (err instanceof ApiError) {
            console.error(`\n🟡 Error de la API de GitHub (HTTP ${err.status})`);
            console.error(`   ${err.message}`);

            if (err.status === 403) {
                console.error(`\n   Has superado el límite de peticiones sin autenticación.`);
                console.error(`   Espera unos minutos o añade un token con: -H "Authorization: Bearer <TOKEN>"\n`);
            } else if (err.status === 422) {
                console.error(`\n   La consulta enviada no es válida. Revisa los parámetros --duration y --limit.\n`);
            } else if (err.status >= 500) {
                console.error(`\n   El servidor de GitHub está experimentando problemas. Inténtalo más tarde.\n`);
            } else {
                console.error(`\n   Consulta la documentación: https://docs.github.com/en/rest\n`);
            }

            process.exit(1);
        }

        // ── Error inesperado (bug / caso no contemplado) ──
        console.error(`\n⚫ Error inesperado`);
        console.error(`   ${err.message}`);
        console.error(`\n   Si el problema persiste, abre un issue en el repositorio.\n`);
        process.exit(1);
    }
})();
