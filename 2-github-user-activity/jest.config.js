/**
 * @file jest.config.js
 * @description Configuración de Jest para un proyecto Next.js con ES Modules.
 *
 * Puntos clave:
 * - `testEnvironment: 'node'`  → los módulos son CLI puros, no necesitan DOM.
 * - `transform: {}`            → desactiva Babel; Node resuelve los imports nativamente.
 * - `extensionsToTreatAsEsm`   → indica a Jest que trate los .js como ESM.
 * - `moduleNameMapper`         → permite que Jest resuelva el alias `@/` de Next.js
 *                                 si en el futuro se importan utilidades desde src/.
 */

/** @type {import('jest').Config} */
const config = {
    // Entorno de ejecución: Node.js (no jsdom)
    testEnvironment: "node",

    // Tratar los archivos .js como ES Modules
    extensionsToTreatAsEsm: [".js"],

    // Sin transformaciones: Node 18+ soporta ESM de forma nativa con --experimental-vm-modules
    transform: {},

    // Alias de Next.js: mapea @/ a la raíz del proyecto
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
    },

    // Carpeta donde Jest buscará los tests
    testMatch: ["**/__tests__/**/*.test.js"],

    // Mostrar cobertura al ejecutar
    collectCoverageFrom: [
        "cli/**/*.js",
        "api/**/*.js",
        "formatter/**/*.js",
        "index.js",
    ],
};

export default config;
