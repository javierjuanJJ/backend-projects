// ============================================================
// movies.js — Punto de entrada de la aplicación CLI
// Uso: node movies.js --type <playing|popular|top|upcoming>
//
// Este archivo NO contiene lógica async propia.
// Solo lee argumentos, valida el tipo y delega en los módulos
// de constantes y fetch correspondientes.
// ============================================================

// Carga las variables de entorno desde el archivo .env
require('dotenv').config();

const { VALID_TYPES } = require('./src/constants/movies');
const { fetchPlaying, fetchPopular, fetchTop, fetchUpcoming } = require('./src/fetch/movies');

// ------------------------------------------------------------
// Lectura del argumento --type desde la línea de comandos
// process.argv: [node, script, ...args]
// ------------------------------------------------------------
const args  = process.argv.slice(2);
const index = args.indexOf('--type');
const type  = index !== -1 ? args[index + 1] : null;

// Validación: el argumento --type es obligatorio
if (!type) {
  console.error('❌  Debes indicar --type <valor>');
  console.error(`   Valores válidos: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

// Validación: el valor debe estar en la lista de tipos permitidos
if (!VALID_TYPES.includes(type)) {
  console.error(`❌  Tipo "${type}" no válido.`);
  console.error(`   Valores válidos: ${VALID_TYPES.join(', ')}`);
  process.exit(1);
}

// ------------------------------------------------------------
// Función auxiliar para imprimir los resultados en consola
// Recibe el objeto data devuelto por la API
// ------------------------------------------------------------
const printResults = data => {
  console.log(`\n🎬  Listado: "${type}"\n`);
  console.log(`Página ${data.page} de ${data.total_pages} | Total: ${data.total_results} películas`);

  // Las listas playing y upcoming incluyen rango de fechas
  if (data.dates) {
    console.log(`Fechas: ${data.dates.minimum} → ${data.dates.maximum}`);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Recorre e imprime cada película del resultado
  data.results.forEach((movie, i) => {
    console.log(`${i + 1}. ${movie.title} (${movie.release_date})`);
    console.log(`   ⭐ ${movie.vote_average} (${movie.vote_count} votos) | 🔥 ${movie.popularity}`);
    console.log(`   ${movie.overview.slice(0, 120)}...`);
    console.log('');
  });
};

// ------------------------------------------------------------
// Switch principal: selecciona el fetch según el tipo recibido
// y encadena la impresión de resultados con .then()
// No se usa async/await en este archivo
// ------------------------------------------------------------
switch (type) {
  case 'playing':
    fetchPlaying().then(printResults).catch(console.error);
    break;

  case 'popular':
    fetchPopular().then(printResults).catch(console.error);
    break;

  case 'top':
    fetchTop().then(printResults).catch(console.error);
    break;

  case 'upcoming':
    fetchUpcoming().then(printResults).catch(console.error);
    break;
}
