# 🌤️ Weather API

API REST con **Express**, **Prisma ORM**, **Redis** (caché 12h) y **Visual Crossing Weather API**.

## Stack

| Capa         | Tecnología                          |
|--------------|-------------------------------------|
| Framework    | Express 4                           |
| ORM          | Prisma (SQLite dev / PostgreSQL prod)|
| Caché        | Redis + node-redis v4               |
| Validación   | Zod v3                              |
| Weather API  | Visual Crossing Timeline API        |
| Runtime      | Node.js ≥ 18                        |

---

## Estructura del proyecto

```
weather-api/
├── prisma/
│   ├── schema.prisma       # Modelos WeatherQuery y FavoriteLocation
│   └── seed.js             # Datos iniciales
│
├── src/
│   ├── config.js           # Constantes y defaults globales
│   │
│   ├── lib/
│   │   ├── prisma.js       # Singleton del cliente Prisma
│   │   └── redis.js        # Singleton Redis + helpers cacheGet/cacheSet/cacheDel
│   │
│   ├── schemas/
│   │   └── weather.js      # Validaciones Zod (query params + favoritos)
│   │
│   ├── middlewares/
│   │   ├── cors.js         # CORS configurable con lista de orígenes
│   │   └── errorHandler.js # Manejador global de errores + WeatherApiError
│   │
│   ├── models/
│   │   └── weather.js      # WeatherModel + FavoriteLocationModel (Prisma + Redis)
│   │
│   ├── controllers/
│   │   ├── weather.js      # WeatherController (getWeather, getHistory, invalidateCache)
│   │   └── favorites.js    # FavoritesController (CRUD completo)
│   │
│   ├── routes/
│   │   ├── weather.js      # GET /weather, GET /weather/history, DELETE /weather/cache
│   │   └── favorites.js    # CRUD /favorites
│   │
│   └── app.js              # Punto de entrada Express
│
├── .env.example
├── package.json
└── README.md
```

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# → Edita .env y agrega tu VISUALCROSSING_API_KEY

# 3. Iniciar Redis
docker run -d -p 6379:6379 redis:latest

# 4. Crear base de datos y ejecutar migraciones
npm run db:migrate       # Crea dev.db y aplica el schema

# 5. (Opcional) Cargar datos de ejemplo
npm run db:seed

# 6. Arrancar el servidor
npm run dev
```

---

## Variables de entorno

| Variable                  | Default                  | Descripción                        |
|---------------------------|--------------------------|------------------------------------|
| `PORT`                    | `3000`                   | Puerto del servidor                |
| `NODE_ENV`                | `development`            | Entorno de ejecución               |
| `DATABASE_URL`            | `file:./dev.db`          | URL de conexión Prisma             |
| `REDIS_URL`               | `redis://localhost:6379` | URL de conexión Redis              |
| `VISUALCROSSING_API_KEY`  | —                        | **Requerida.** API Key de Visual Crossing |
| `CACHE_TTL_SECONDS`       | `43200` (12h)            | TTL del caché en segundos          |

---

## Endpoints

### 🌤️ Clima

| Método   | URL                     | Descripción                                    |
|----------|-------------------------|------------------------------------------------|
| `GET`    | `/weather`              | Obtener clima (caché Redis 12h)                |
| `GET`    | `/weather/history`      | Historial de consultas (Prisma)                |
| `DELETE` | `/weather/cache`        | Invalidar caché de una consulta                |

#### Query params de `GET /weather`

| Parámetro   | Tipo     | Requerido | Default              | Descripción                                     |
|-------------|----------|-----------|----------------------|-------------------------------------------------|
| `location`  | string   | ✅        | —                    | Dirección, lat/lon, postal code                 |
| `date1`     | string   | —         | —                    | Fecha (yyyy-MM-dd) o keyword dinámico           |
| `date2`     | string   | —         | —                    | Fecha fin (solo con date1)                      |
| `unitGroup` | enum     | —         | `metric`             | `us`, `uk`, `metric`, `base`                    |
| `lang`      | string   | —         | `es`                 | Código de idioma ISO 639-1                      |
| `include`   | string   | —         | `days,hours,current` | Secciones separadas por coma                    |

#### Ejemplos de uso

```bash
# Pronóstico próximos 15 días
GET /weather?location=Madrid,ES

# Condiciones de hoy
GET /weather?location=London,UK&date1=today&include=current,days

# Rango histórico
GET /weather?location=Paris,FR&date1=2025-03-01&date2=2025-03-07&include=days

# Por coordenadas
GET /weather?location=-34.6037,-58.3816&date1=today

# En unidades imperiales e inglés
GET /weather?location=New York,US&unitGroup=us&lang=en

# Invalidar caché
DELETE /weather/cache?location=Madrid,ES

# Historial paginado
GET /weather/history?limit=5&offset=0
```

### ⭐ Favoritos

| Método   | URL               | Descripción                      |
|----------|-------------------|----------------------------------|
| `GET`    | `/favorites`      | Listar todas las favoritas       |
| `GET`    | `/favorites/:id`  | Obtener una favorita por ID      |
| `POST`   | `/favorites`      | Crear nueva favorita             |
| `PUT`    | `/favorites/:id`  | Reemplazar favorita completa     |
| `PATCH`  | `/favorites/:id`  | Actualización parcial            |
| `DELETE` | `/favorites/:id`  | Eliminar favorita                |

#### Body de `POST /favorites` y `PUT /favorites/:id`

```json
{
  "name": "Mi ciudad",
  "location": "Madrid,ES"
}
```

---

## Flujo de caché

```
GET /weather?location=Madrid,ES
        │
        ├─ buildCacheKey("Madrid,ES") → "weather:madrid,es"
        │
        ├─ redis.get("weather:madrid,es")
        │       ├─ HIT  → retorna JSON + _meta.fromCache: true
        │       └─ MISS → fetch(Visual Crossing API)
        │                      ├─ redis.set(key, JSON, { EX: 43200 })
        │                      └─ prisma.weatherQuery.upsert(...)
        │
        └─ { ...weatherData, _meta: { fromCache, cacheKey, ttlRemaining } }
```

---

## Keywords dinámicos de Visual Crossing

Úsalos como `date1` para consultas relativas sin hardcodear fechas:

`today` · `yesterday` · `tomorrow` · `last7days` · `last30days` · `last365days` · `next7days` · `next30days` · `lastyear` · `thisyear`

---

## Secciones disponibles para `include`

| Valor     | Descripción                               |
|-----------|-------------------------------------------|
| `days`    | Resumen diario                            |
| `hours`   | Datos por hora                            |
| `minutes` | Datos por minuto (beta)                   |
| `current` | Condiciones actuales                      |
| `alerts`  | Alertas meteorológicas activas            |
| `obs`     | Observaciones históricas de estaciones    |
| `fcst`    | Pronóstico (modelos 16 días)              |
| `stats`   | Estadísticas y normales históricas        |

---

## Scripts disponibles

```bash
npm run dev          # Servidor con hot-reload
npm run start        # Producción
npm run db:migrate   # Aplica migraciones Prisma
npm run db:generate  # Regenera el cliente Prisma
npm run db:studio    # Abre Prisma Studio (UI de BD)
npm run db:seed      # Carga datos iniciales
```
