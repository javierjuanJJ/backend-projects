// ============================================================
// constants/movies.js
// Centraliza todos los valores fijos de la aplicación:
// tipos válidos, URLs de la API y cabeceras HTTP
// ============================================================

// Tipos de listado aceptados por el parámetro --type
const VALID_TYPES = ['playing', 'popular', 'top', 'upcoming'];

// URL base de la API de TMDB
const BASE_URL = 'https://api.themoviedb.org/3/movie';

// Mapa de tipo → endpoint correspondiente en la API
const ENDPOINTS = {
  playing:  `${BASE_URL}/now_playing?language=en-US&page=1`,
  popular:  `${BASE_URL}/popular?language=en-US&page=1`,
  top:      `${BASE_URL}/top_rated?language=en-US&page=1`,
  upcoming: `${BASE_URL}/upcoming?language=en-US&page=1`,
};

// Cabeceras HTTP comunes para todas las peticiones
// El token se lee desde la variable de entorno TMDB_TOKEN
const HEADERS = {
  accept: 'application/json',
  Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
};

module.exports = { VALID_TYPES, ENDPOINTS, HEADERS };
