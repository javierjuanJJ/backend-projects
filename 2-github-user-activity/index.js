/**
 * @file index.js
 * @description Punto de entrada principal de la CLI.
 * Valida los argumentos y orquesta la obtención y presentación
 * de la actividad pública de un usuario de GitHub.
 */

import { fetchUserEvents } from "./api/githubClient.js";
import { formatEvents } from "./formatter/eventFormatter.js";
import { validateArgs } from "./cli/args.js";

/**
 * Función principal que ejecuta la CLI.
 * Gestiona el flujo completo: validación → fetch → formato → salida.
 */
async function main() {
    // 1. Validar y obtener el nombre de usuario desde los argumentos
    const username = validateArgs(process.argv.slice(2));

    // 2. Obtener los eventos del usuario desde la API de GitHub
    const events = await fetchUserEvents(username);

    // 3. Si no hay eventos (p.ej. respuesta 304), salir sin error
    if (!events) return;

    // 4. Formatear los eventos en líneas legibles
    const lines = formatEvents(events);

    // 5. Imprimir la salida
    console.log("Output:");
    lines.forEach((line) => console.log(line));
}

// Ejecutar y capturar errores no controlados a nivel de proceso
main().catch((err) => {
    console.error("❌ Error inesperado:", err.message);
    process.exit(1);
});
