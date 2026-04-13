// ============================================================
// fetch/movies.js
// Contiene la lógica de peticiones a la API de TMDB.
// Cada función devuelve una Promise con los datos del listado.
// ============================================================

const { ENDPOINTS, HEADERS } = require('../constants/movies');

// Opciones base reutilizadas en todos los fetch
const OPTIONS = { method: 'GET', headers: HEADERS };

// ------------------------------------------------------------
// fetchPlaying
// Obtiene las películas actualmente en cartelera (now_playing)
// ------------------------------------------------------------
const fetchPlaying = () =>
  fetch(ENDPOINTS.playing, OPTIONS)
    .then(res => res.json())
    .catch(err => { throw new Error(`Error en fetchPlaying: ${err.message}`); });

// ------------------------------------------------------------
// fetchPopular
// Obtiene el listado de películas más populares del momento
// ------------------------------------------------------------
const fetchPopular = () =>
  fetch(ENDPOINTS.popular, OPTIONS)
    .then(res => res.json())
    .catch(err => { throw new Error(`Error en fetchPopular: ${err.message}`); });

// ------------------------------------------------------------
// fetchTop
// Obtiene las películas mejor valoradas de todos los tiempos
// ------------------------------------------------------------
const fetchTop = () =>
  fetch(ENDPOINTS.top, OPTIONS)
    .then(res => res.json())
    .catch(err => { throw new Error(`Error en fetchTop: ${err.message}`); });

// ------------------------------------------------------------
// fetchUpcoming
// Obtiene las películas próximas a estrenarse
// ------------------------------------------------------------
const fetchUpcoming = () =>
  fetch(ENDPOINTS.upcoming, OPTIONS)
    .then(res => res.json())
    .catch(err => { throw new Error(`Error en fetchUpcoming: ${err.message}`); });

module.exports = { fetchPlaying, fetchPopular, fetchTop, fetchUpcoming };
