# 🏆 Leaderboard System API

REST API for a gaming leaderboard system. Built with Next.js custom Express server, Prisma ORM, Redis cache, and JWT authentication.

[![CI / Deploy](https://github.com/YOUR_ORG/leaderboard-api/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/leaderboard-api/actions/workflows/ci.yml)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js + Express (custom server) |
| Language | JavaScript (ESM) |
| ORM | Prisma 6 |
| Database | MySQL 8 |
| Cache | Redis 7 |
| Auth | JWT + bcryptjs |
| Validation | Zod v4 |
| Tests | Vitest + Supertest |
| Deploy | Docker → Cubepath (Coolify) |

---

## Project structure

```
.
├── src/
│   ├── controllers/       # HTTP handlers (static async methods)
│   ├── models/            # Prisma queries (all DB logic)
│   ├── routes/            # Express Router definitions
│   ├── schemas/           # Zod validation schemas
│   ├── middlewares/       # cors, auth JWT, errorHandler
│   └── lib/
│       ├── prisma.js      # Prisma client singleton
│       └── redis.js       # ioredis client singleton
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── tests/                 # Vitest + Supertest test files
├── .github/
│   ├── copilot/
│   │   ├── agents/        # Custom Copilot agents
│   │   ├── instructions/  # Copilot coding instructions
│   │   └── skills/        # Reusable Copilot skills
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
├── ansible/               # Deployment playbooks
├── docker-compose.yml
├── .env.example
└── app.js
```

---

## Quick start (local)

### Prerequisites
- Node.js 22+
- pnpm 9+
- Docker + Docker Compose

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_ORG/leaderboard-api.git
cd leaderboard-api
cp .env.example .env
# Edit .env with your values
```

### 2. Start infrastructure

```bash
# Start MySQL + Redis
docker compose up mysql redis -d

# Optional: start Prisma Studio
docker compose --profile dev up prisma-studio -d
```

### 3. Install dependencies and migrate

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed     # optional: load sample data
```

### 4. Run the API

```bash
pnpm dev       # Next.js dev server
# or
pnpm start     # Production mode
```

API available at: `http://localhost:3000`
Prisma Studio at: `http://localhost:5555`

---

## API Endpoints

### Auth
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login, get JWT | No |

### Users
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/users` | List users | ✅ |
| GET | `/users/:id` | Get user by id | ✅ |
| PATCH | `/users/:id` | Update user | ✅ |
| DELETE | `/users/:id` | Delete user | ✅ |

### Games
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/games` | List games | ✅ |
| GET | `/games/:id` | Get game | ✅ |
| POST | `/games` | Create game | ✅ |
| PATCH | `/games/:id` | Update game | ✅ |
| DELETE | `/games/:id` | Delete game | ✅ |

### Scores
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/scores` | List scores | ✅ |
| POST | `/scores` | Submit score | ✅ |
| DELETE | `/scores/:id` | Delete score | ✅ |

### Leaderboard
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/leaderboard/:gameId` | Top scores for game | ✅ |
| GET | `/leaderboard/:gameId/weekly` | Weekly top scores | ✅ |
| GET | `/leaderboard/:gameId/alltime` | All-time top scores | ✅ |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |

---

## Testing

```bash
# Run all tests with coverage
pnpm vitest run --coverage

# Watch mode
pnpm vitest

# Single file
pnpm vitest tests/scores.test.js
```

Tests require a running MySQL and Redis (or use the test services in the CI workflow).

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) has three jobs:

1. **test** — spins up MySQL + Redis as services, runs Prisma migrations, runs Vitest. Runs on every push and PR.
2. **build** — builds and pushes a Docker image to GitHub Container Registry. Runs only on `main` after tests pass.
3. **deploy** — triggers the Coolify webhook to deploy to Cubepath. Runs after image build.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `COOLIFY_WEBHOOK_URL` | Coolify deploy webhook URL |
| `COOLIFY_TOKEN` | Coolify API token |
| `APP_URL` | Production URL for health check |

---

## Docker

```bash
# Full stack (dev)
docker compose up -d

# Full stack with Prisma Studio
docker compose --profile dev up -d

# Production build
docker compose up app -d

# View logs
docker compose logs -f app
```

---

## Deployment (Ansible)

```bash
# Install dependencies
pip install ansible
ansible-galaxy collection install community.docker

# Encrypt secrets (first time)
ansible-vault encrypt ansible/vars/secrets.yml

# Deploy
ansible-playbook ansible/deploy.yml -i ansible/inventory.yml --vault-password-file .vault-pass
```

---

## GitHub Copilot Agents

This repo includes custom agents in `.github/copilot/agents/`:

| Agent | Purpose |
|---|---|
| `leaderboard-api-architect` | Generate controllers, models, routes, schemas |
| `prisma-db-specialist` | Prisma queries, migrations, seed |
| `api-tdd-agent` | Vitest + Supertest test generation |
| `devops-deploy-agent` | CI/CD, Docker, Ansible tasks |

Activate in GitHub Copilot Chat: `@leaderboard-api-architect Generate the scores controller`

---

## Environment variables

See `.env.example` for all required variables with descriptions.

---

## License

MIT
