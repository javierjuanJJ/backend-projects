# Express + Prisma ORM — API de Gastos

API REST con **Express 4**, **Prisma ORM**, **PostgreSQL**, **Zod** y **JWT**.

Estructura basada en el patrón `controllers / middlewares / models / routes / schemas`.

---

## 📁 Estructura

```
express-prisma-expenses/
├── app.js                        ← Punto de entrada
├── config.js                     ← Constantes globales (PORT, paginación)
├── prisma/
│   ├── schema.prisma             ← Modelos User y Expense
│   └── seed.js                   ← Datos de ejemplo
├── lib/
│   ├── prisma.js                 ← Singleton PrismaClient
│   └── auth.js                   ← Helpers bcrypt + JWT
├── schemas/
│   ├── users.js                  ← Zod: validateUser / validatePartialUser
│   └── expenses.js               ← Zod: validateExpense / validatePartialExpense
├── middlewares/
│   ├── cors.js                   ← corsMiddleware() con lista blanca de orígenes
│   ├── auth.js                   ← authMiddleware — guarda JWT
│   └── errorHandler.js           ← errorHandler + notFoundHandler globales
├── models/
│   ├── user.js                   ← UserModel (Prisma)
│   └── expense.js                ← ExpenseModel (Prisma + filtros)
├── controllers/
│   ├── auth.js                   ← AuthController (register, login)
│   └── expenses.js               ← ExpenseController (CRUD completo)
├── routes/
│   ├── auth.js                   ← POST /auth/register  POST /auth/login
│   └── expenses.js               ← GET POST PUT PATCH DELETE /expenses
├── .env.example
├── .gitignore
└── package.json
```

---

## ⚙️ Instalación

```bash
git clone <repo>
cd express-prisma-expenses
npm install

cp .env.example .env
# → Editar DATABASE_URL y JWT_SECRET
```

### Base de datos

```bash
npm run db:migrate     # npx prisma migrate dev
npm run db:generate    # npx prisma generate
npm run db:seed        # poblar con datos de ejemplo
npm run db:studio      # GUI visual de Prisma
```

### Arrancar

```bash
npm run dev    # node --watch app.js
npm start      # node app.js
```

---

## 🔒 Seguridad

| Mecanismo | Detalle |
|-----------|---------|
| **bcrypt** | Contraseñas hasheadas con 12 salt rounds |
| **JWT** | Token firmado, expira en 7 días (configurable) |
| **Zod** | Validación estricta en todos los endpoints |
| **CORS** | Lista blanca de orígenes, configurable por `.env` |
| **Ownership** | Cada usuario solo accede a sus propios gastos |

---

## 🔌 API Reference

### Auth

| Método | Ruta | Body | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | `{email, password}` | Registrar usuario |
| POST | `/auth/login` | `{email, password}` | Login → JWT |

### Expenses  *(requieren `Authorization: Bearer <token>`)*

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/expenses` | Listar gastos (con filtros) |
| GET | `/expenses/:id` | Obtener por ID |
| POST | `/expenses` | Crear gasto |
| PUT | `/expenses/:id` | Reemplazar gasto completo |
| PATCH | `/expenses/:id` | Actualizar campos parciales |
| DELETE | `/expenses/:id` | Eliminar gasto |

### Filtros GET `/expenses`

| Query param | Tipo | Ejemplo | Descripción |
|-------------|------|---------|-------------|
| `search` | string | `?search=café` | Busca en `title` OR `description` |
| `minAmount` | number | `?minAmount=10` | Monto mínimo |
| `maxAmount` | number | `?maxAmount=200` | Monto máximo |
| `limit` | number | `?limit=10` | Resultados por página (default 20) |
| `offset` | number | `?offset=20` | Desplazamiento (default 0) |

---

## 🧪 Ejemplos curl

```bash
# Registrar
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"yo@test.com","password":"pass123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"yo@test.com","password":"pass123"}' | jq -r '.data.token')

# Crear gasto
curl -X POST http://localhost:3000/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Café","description":"Café del trabajo","amount":3.50}'

# Listar todos
curl http://localhost:3000/expenses \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por texto
curl "http://localhost:3000/expenses?search=café" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por rango
curl "http://localhost:3000/expenses?minAmount=10&maxAmount=100" \
  -H "Authorization: Bearer $TOKEN"

# Actualizar parcial
curl -X PATCH http://localhost:3000/expenses/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":4.00}'

# Eliminar
curl -X DELETE http://localhost:3000/expenses/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📦 Scripts

```bash
npm run dev          # Desarrollo con hot-reload
npm start            # Producción
npm run db:migrate   # Ejecutar migraciones
npm run db:generate  # Regenerar Prisma Client
npm run db:seed      # Insertar datos de ejemplo
npm run db:studio    # Abrir Prisma Studio
npm run db:reset     # Resetear BD completa
```
