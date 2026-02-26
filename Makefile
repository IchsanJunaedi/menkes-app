.PHONY: dev test migrate seed lint build help

# ─── Dev ─────────────────────────────────────────────────────────────────────

dev: ## Start all services (Docker + apps)
	docker compose up -d
	npm run dev

dev-docker: ## Start only Docker services (DB, Redis, Keycloak, etc.)
	docker compose up -d

dev-apps: ## Start only apps (no Docker)
	npm run dev

# ─── Build ───────────────────────────────────────────────────────────────────

build: ## Build all apps
	npm run build

# ─── Tests ───────────────────────────────────────────────────────────────────

test: ## Run all tests
	npm run test

test-api: ## Run only API tests
	npm run test --workspace=apps/api

test-web: ## Run only Web tests
	npm run test --workspace=apps/web

# ─── Lint ────────────────────────────────────────────────────────────────────

lint: ## Lint all packages
	npm run lint

lint-fix: ## Lint + auto-fix all packages
	npm run lint:fix

format: ## Format all files with Prettier
	npm run format

# ─── Database ────────────────────────────────────────────────────────────────

migrate: ## Run Prisma migrations
	npm run prisma migrate dev --workspace=apps/api

migrate-prod: ## Run Prisma migrations in production (no shadow DB)
	npm run prisma migrate deploy --workspace=apps/api

seed: ## Seed the database with dummy data
	npm run prisma db seed --workspace=apps/api

db-reset: ## Reset DB and re-seed (DESTRUCTIVE — dev only)
	npm run prisma migrate reset --workspace=apps/api

db-studio: ## Open Prisma Studio (visual DB browser)
	npm run prisma studio --workspace=apps/api

# ─── Help ────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
