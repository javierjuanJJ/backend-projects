/**
 * @file presenter.js
 * @description Responsable exclusivamente de la presentación en consola.
 *              Formatea y muestra la lista de repositorios trending
 *              y los mensajes de progreso al usuario.
 *              No contiene lógica de negocio ni llamadas a la API.
 */

// ─────────────────────────────────────────────
//  Mensajes de progreso
// ─────────────────────────────────────────────

/**
 * Muestra en consola el mensaje de búsqueda en curso.
 *
 * @param {number} limit    - Número de repos que se van a pedir
 * @param {string} duration - Período de tiempo seleccionado
 */
function printSearching(limit, duration) {
    console.log(`\n🔍 Buscando los ${limit} repositorios más populares del último ${duration}...\n`);
}

// ─────────────────────────────────────────────
//  Resultados
// ─────────────────────────────────────────────

/**
 * Imprime la lista de repositorios trending con formato legible.
 * Si la lista está vacía, avisa al usuario y termina.
 *
 * @param {object[]} repos    - Repositorios devueltos por la API
 * @param {string}   duration - Período usado en la búsqueda (para el título)
 */
function printRepos(repos, duration) {
    if (repos.length === 0) {
        console.log('⚠️  No se encontraron repositorios para este período.');
        return;
    }

    console.log(`🔥 Trending Repositories — Last ${duration}\n`);
    console.log('─'.repeat(60));

    repos.forEach((repo, index) => {
        const position = String(index + 1).padStart(2, '0');
        const stars    = repo.stargazers_count.toLocaleString();
        const forks    = repo.forks_count.toLocaleString();
        const language = repo.language ?? 'N/A';
        const desc     = repo.description ?? '(sin descripción)';

        console.log(`\n#${position}  ${repo.full_name}`);
        console.log(`     📝 ${desc}`);
        console.log(`     ⭐ ${stars} stars   🍴 ${forks} forks   💻 ${language}`);
        console.log(`     🔗 ${repo.html_url}`);
    });

    console.log('\n' + '─'.repeat(60) + '\n');
}

// ─────────────────────────────────────────────
//  Exports
// ─────────────────────────────────────────────

module.exports = { printSearching, printRepos };
