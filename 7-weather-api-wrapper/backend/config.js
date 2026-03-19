// src/config.js
// Constantes globales y valores por defecto de la aplicación

export const DEFAULTS = {
  PORT: 3000,
  LIMIT_PAGINATION: 10,
  LIMIT_OFFSET: 0,
  CACHE_TTL: 43200, // 12 horas en segundos
}

export const ACCEPTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4321',
  'http://localhost:1234',
]

export const VISUALCROSSING_BASE_URL =
  'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline'
