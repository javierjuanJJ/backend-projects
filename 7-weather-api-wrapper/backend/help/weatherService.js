// src/weatherService.js
// ──────────────────────────────────────────────────────────────────────────────
// Servicio de clima con caché Redis (JSON, TTL 12h)
//
// Flujo:
//   1. Construir cache key a partir de la ubicación + rango de fechas
//   2. Buscar en Redis  →  HIT: retorna JSON cacheado
//                      →  MISS: llama a Visual Crossing API
//                               guarda respuesta en Redis con EX 43200s
//                               retorna datos frescos
//
// Visual Crossing Timeline API:
//   GET https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline
//       /{location}[/{date1}[/{date2}]]?key=KEY&unitGroup=metric&lang=es
// ──────────────────────────────────────────────────────────────────────────────

import { getRedisClient } from './redisClient.js';

// ── Constantes ────────────────────────────────────────────────────────────────
const VC_BASE_URL =
  'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline';

const API_KEY = process.env.VISUALCROSSING_API_KEY;

/** TTL del caché en segundos (por defecto 12 horas). */
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS ?? '43200', 10);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Genera la cache key de Redis.
 * Formato: weather:{location}:{date1}:{date2}
 * Ejemplo: weather:london,uk:2025-03-11:2025-03-13
 *
 * Se normaliza a minúsculas para evitar duplicados por capitalización.
 */
function buildCacheKey(location, date1, date2) {
  const parts = ['weather', location.toLowerCase().replace(/\s+/g, '_')];
  if (date1) parts.push(date1);
  if (date2) parts.push(date2);
  return parts.join(':');
}

/**
 * Construye la URL de la Timeline Weather API.
 *
 * @param {string} location   - Dirección, lat/lon o código postal.
 * @param {string|null} date1 - Fecha inicial (yyyy-MM-dd) o keyword (today, last7days…).
 * @param {string|null} date2 - Fecha final (yyyy-MM-dd). Opcional.
 * @param {object} params     - Parámetros query adicionales.
 */
function buildApiUrl(location, date1, date2, params = {}) {
  const segments = [VC_BASE_URL, encodeURIComponent(location)];
  if (date1) segments.push(date1);
  if (date2) segments.push(date2);

  const query = new URLSearchParams({
    key: API_KEY,
    unitGroup: params.unitGroup ?? 'metric',
    lang: params.lang ?? 'es',
    include: params.include ?? 'days,hours,current',
    ...params,
  });

  // Eliminamos parámetros que ya incluimos explícitamente para no duplicar
  query.delete('unitGroup');
  query.delete('lang');
  query.delete('include');

  return `${segments.join('/')}?key=${API_KEY}&unitGroup=${
    params.unitGroup ?? 'metric'
  }&lang=${params.lang ?? 'es'}&include=${params.include ?? 'days,hours,current'}`;
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Obtiene datos meteorológicos con caché Redis de 12 horas.
 *
 * @param {string}      location   - Ubicación (ej: "Madrid,ES", "40.4168,-3.7038")
 * @param {string|null} date1      - Fecha inicial o keyword dinámico (ej: "today", "2025-03-11")
 * @param {string|null} date2      - Fecha final (solo para rangos)
 * @param {object}      apiParams  - Parámetros extra de la API (unitGroup, lang, include…)
 *
 * @returns {Promise<{ data: object, fromCache: boolean, cacheKey: string, ttlRemaining: number|null }>}
 */
export async function getWeather(location, date1 = null, date2 = null, apiParams = {}) {
  if (!API_KEY) {
    throw new Error('VISUALCROSSING_API_KEY no está definida en las variables de entorno.');
  }

  const redis = await getRedisClient();
  const cacheKey = buildCacheKey(location, date1, date2);

  // ── PASO 1: Buscar en caché ─────────────────────────────────────────────────
  console.log(`\n[Cache] Buscando clave: "${cacheKey}"`);
  const cached = await redis.get(cacheKey);

  if (cached !== null) {
    // ── CACHE HIT ─────────────────────────────────────────────────────────────
    const ttlRemaining = await redis.ttl(cacheKey); // segundos restantes
    console.log(`[Cache] ✅ HIT — TTL restante: ${ttlRemaining}s (${(ttlRemaining / 3600).toFixed(1)}h)`);

    return {
      data: JSON.parse(cached),
      fromCache: true,
      cacheKey,
      ttlRemaining,
    };
  }

  // ── PASO 2: CACHE MISS → llamar a Visual Crossing API ──────────────────────
  console.log(`[Cache] ❌ MISS — Llamando a Visual Crossing API...`);

  const url = buildApiUrl(location, date1, date2, apiParams);
  console.log(`[API]   URL: ${url.replace(API_KEY, '***API_KEY***')}`);

  const response = await fetch(url);

  // Manejo de errores HTTP de la API
  if (!response.ok) {
    const errorBody = await response.text();
    throw new WeatherApiError(
      `Visual Crossing API respondió con ${response.status}: ${errorBody}`,
      response.status
    );
  }

  const weatherData = await response.json();

  // ── PASO 3: Guardar en Redis con TTL de 12 horas ────────────────────────────
  // Usamos SET con la opción EX (expire en segundos)
  await redis.set(cacheKey, JSON.stringify(weatherData), { EX: CACHE_TTL });

  console.log(
    `[Cache] 💾 Guardado con clave "${cacheKey}" — expira en ${CACHE_TTL}s (${(CACHE_TTL / 3600).toFixed(0)}h)`
  );

  return {
    data: weatherData,
    fromCache: false,
    cacheKey,
    ttlRemaining: CACHE_TTL,
  };
}

/**
 * Invalida manualmente una entrada del caché.
 * Útil para forzar refresco de datos.
 */
export async function invalidateCache(location, date1 = null, date2 = null) {
  const redis = await getRedisClient();
  const cacheKey = buildCacheKey(location, date1, date2);
  const deleted = await redis.del(cacheKey);
  console.log(`[Cache] 🗑️  Clave "${cacheKey}" ${deleted ? 'eliminada' : 'no existía'}`);
  return deleted > 0;
}

// ── Error personalizado ───────────────────────────────────────────────────────

export class WeatherApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'WeatherApiError';
    this.statusCode = statusCode;
  }
}
