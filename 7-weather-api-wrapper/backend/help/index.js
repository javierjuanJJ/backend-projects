// src/index.js
// ──────────────────────────────────────────────────────────────────────────────
// Punto de entrada — demuestra el uso de getWeather() con caché Redis
//
// Antes de ejecutar:
//   1. cp .env.example .env   y rellena VISUALCROSSING_API_KEY
//   2. Asegúrate de tener Redis corriendo: docker run -p 6379:6379 redis
//   3. npm install && npm start
// ──────────────────────────────────────────────────────────────────────────────

// Carga variables de entorno desde .env (Node 20.6+ soporta --env-file nativo)
// Para versiones anteriores usa: import 'dotenv/config'
import { readFileSync } from 'fs';
loadEnv('.env');

import { getWeather, invalidateCache, WeatherApiError } from './weatherService.js';
import { closeRedisClient } from './redisClient.js';

// ── Utilidad mínima para cargar .env sin dependencias externas ─────────────────
function loadEnv(path) {
  try {
    const lines = readFileSync(path, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...rest] = trimmed.split('=');
      const value = rest.join('=').trim();
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env opcional — se ignora si no existe
  }
}

// ── Helpers de presentación ───────────────────────────────────────────────────
function printWeatherSummary(result) {
  const { data, fromCache, cacheKey, ttlRemaining } = result;
  const source = fromCache
    ? `✅ CACHÉ (expira en ${(ttlRemaining / 3600).toFixed(1)}h)`
    : `🌐 API EXTERNA (guardado ${(ttlRemaining / 3600).toFixed(0)}h)`;

  console.log('\n' + '═'.repeat(60));
  console.log(`📍 Ubicación  : ${data.resolvedAddress}`);
  console.log(`🔑 Cache key  : ${cacheKey}`);
  console.log(`📦 Origen     : ${source}`);
  console.log(`🌍 Timezone   : ${data.timezone}`);
  console.log(`💲 Query cost : ${data.queryCost} registros`);
  console.log('─'.repeat(60));

  if (data.currentConditions) {
    const c = data.currentConditions;
    console.log('⏱  Condiciones actuales:');
    console.log(`   Temp: ${c.temp}°C   Sensación: ${c.feelslike}°C`);
    console.log(`   Humedad: ${c.humidity}%   Viento: ${c.windspeed} km/h`);
    console.log(`   Estado: ${c.conditions}`);
    console.log('─'.repeat(60));
  }

  if (data.days?.length) {
    console.log('📅 Próximos días:');
    data.days.slice(0, 5).forEach((day) => {
      console.log(
        `   ${day.datetime}  Max: ${day.tempmax}°C  Min: ${day.tempmin}°C  ${day.conditions}`
      );
    });
  }

  console.log('═'.repeat(60) + '\n');
}

// ── Escenarios de ejemplo ─────────────────────────────────────────────────────
async function main() {
  try {
    console.log('🚀 Weather Cache App — Visual Crossing + Redis\n');

    // ──────────────────────────────────────────────────────────────────────────
    // Ejemplo 1: Pronóstico de los próximos 15 días (sin fechas = forecast)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📌 Ejemplo 1: Pronóstico para Madrid (próximos 15 días)');
    const madrid = await getWeather('Madrid,ES');
    printWeatherSummary(madrid);

    // ──────────────────────────────────────────────────────────────────────────
    // Ejemplo 2: Segunda llamada — debería venir del caché
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📌 Ejemplo 2: Misma consulta — debe retornar desde CACHÉ');
    const madridCached = await getWeather('Madrid,ES');
    printWeatherSummary(madridCached);

    // ──────────────────────────────────────────────────────────────────────────
    // Ejemplo 3: Rango de fechas histórico
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📌 Ejemplo 3: Datos históricos — Londres, últimos 3 días');
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const fmt = (d) => d.toISOString().slice(0, 10);
    const london = await getWeather('London,UK', fmt(threeDaysAgo), fmt(today), {
      include: 'days',        // Solo datos diarios (sin horas) → menor coste de query
      unitGroup: 'metric',
    });
    printWeatherSummary(london);

    // ──────────────────────────────────────────────────────────────────────────
    // Ejemplo 4: Keyword dinámico "today"
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📌 Ejemplo 4: Condiciones de hoy por lat/lon (Buenos Aires)');
    const buenosAires = await getWeather('-34.6037,-58.3816', 'today', null, {
      include: 'current,days',
    });
    printWeatherSummary(buenosAires);

    // ──────────────────────────────────────────────────────────────────────────
    // Ejemplo 5: Invalidar caché manualmente
    // ──────────────────────────────────────────────────────────────────────────
    console.log('📌 Ejemplo 5: Invalidar caché de Madrid');
    const deleted = await invalidateCache('Madrid,ES');
    console.log(`   Caché ${deleted ? 'eliminado ✅' : 'no encontrado ⚠️'}\n`);

    // Tras invalidar, la próxima llamada irá a la API nuevamente
    console.log('📌 Ejemplo 6: Madrid de nuevo (caché vacío → llama a la API)');
    const madridFresh = await getWeather('Madrid,ES');
    printWeatherSummary(madridFresh);

  } catch (err) {
    if (err instanceof WeatherApiError) {
      console.error(`\n❌ Error de API (HTTP ${err.statusCode}): ${err.message}`);
    } else {
      console.error(`\n❌ Error inesperado: ${err.message}`);
    }
  } finally {
    // Siempre cierra la conexión Redis al terminar
    await closeRedisClient();
  }
}

main();
