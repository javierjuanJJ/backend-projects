# Makefile — Leaderboard API
# Usage: make <target>

.PHONY: help dev stop build test migrate seed studio logs clean

# Default target
help:
	@echo ""
	@echo "  Leaderboard API — available commands"
	@echo ""
	@echo "  Dev"
	@echo "    make dev        Start infra (MySQL + Redis) and run API in watch mode"
	@echo "    make stop       Stop all Docker containers"
	@echo "    make studio     Open Prisma Studio (port 5555)"
	@echo "    make logs       Tail app container logs"
	@echo ""
	@echo "  Database"
	@echo "    make migrate    Run pending Prisma migrations"
	@echo "    make seed       Seed the database with sample data"
	@echo "    make reset      Drop + recreate DB and re-seed (DEV ONLY)"
	@echo ""
	@echo "  Testing"
	@echo "    make test       Run Vitest tests with coverage"
	@echo "    make test-watch Run Vitest in watch mode"
	@echo ""
	@echo "  Docker"
	@echo "    make build      Build production Docker image"
	@echo "    make clean      Remove containers, volumes, and images"
	@echo ""

# ─── Dev ──────────────────────────────────────────────────────────────────────
dev:
	docker compose up mysql redis -d
	@echo "Waiting for MySQL to be healthy..."
	@sleep 3
	pnpm prisma generate
	pnpm dev

stop:
	docker compose down

studio:
	docker compose --profile dev up prisma-studio -d
	@echo "Prisma Studio running at http://localhost:5555"

logs:
	docker compose logs -f app

# ─── Database ─────────────────────────────────────────────────────────────────
migrate:
	pnpm prisma migrate dev

seed:
	pnpm prisma db seed

reset:
	@echo "⚠️  This will DROP and recreate your local DB. Press Ctrl+C to cancel."
	@sleep 3
	pnpm prisma migrate reset --force

# ─── Testing ──────────────────────────────────────────────────────────────────
test:
	docker compose up mysql redis -d
	@sleep 3
	pnpm prisma migrate deploy
	pnpm vitest run --coverage

test-watch:
	pnpm vitest

# ─── Docker ───────────────────────────────────────────────────────────────────
build:
	docker build -t leaderboard-api:local .

clean:
	docker compose down -v --rmi local
	@echo "Containers, volumes, and local images removed."
