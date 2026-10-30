# One entry point for both stacks. Run `make help` for the list.
.DEFAULT_GOAL := help
.PHONY: help up down db backend frontend install hooks test lint check clean demo docker-test docker-check consumer-test

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Build and run the full stack in Docker (postgres, backend, frontend)
	docker compose up --build

down: ## Stop the Docker stack (data volumes are kept)
	docker compose down

db: ## Start only Postgres in Docker, for running backend/frontend locally
	docker compose up -d postgres

backend: ## Run the backend locally against the Docker Postgres (reads .env if present)
	set -a; [ -f .env ] && . ./.env; set +a; \
	cd backend && SPRING_PROFILES_ACTIVE=local ./gradlew bootRun

frontend: ## Run the frontend dev server
	cd frontend && npm run dev

install: hooks ## Install frontend dependencies and the git hooks
	cd frontend && npm ci

hooks: ## Enable the repo's git hooks (.githooks): checks run before every commit and push
	git config core.hooksPath .githooks
	@echo "Git hooks enabled (.githooks/pre-commit, .githooks/pre-push)."

test: ## Run backend tests (needs Docker for Testcontainers)
	cd backend && ./gradlew test

lint: ## Lint and typecheck the frontend
	cd frontend && npm run lint && npm run typecheck

# Same checks inside containers, for machines without a local JDK or the right Node/npm. The Gradle and
# npm caches live in named volumes, so only the first run downloads dependencies. Testcontainers talks
# to the Docker daemon through the mounted socket (Docker Desktop: the default /var/run/docker.sock).
docker-test: ## Run the backend tests in a container (no local JDK needed; needs Docker)
	docker run --rm --add-host host.docker.internal:host-gateway \
	  -v /var/run/docker.sock:/var/run/docker.sock \
	  -v atomity-cms-gradle-cache:/home/gradle/.gradle \
	  -v "$(CURDIR)/backend":/workspace -w /workspace \
	  -e TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal -e TESTCONTAINERS_RYUK_DISABLED=true \
	  gradle:8.11.1-jdk21-alpine gradle test --no-daemon --console=plain

docker-check: ## Frontend lint, typecheck, tests and build in a container (no local Node needed)
	docker run --rm -v atomity-cms-npm-cache:/root/.npm -v "$(CURDIR)/frontend":/app -w /app \
	  node:24-alpine sh -c "npm ci --no-audit --no-fund && npm run check"

check: test ## Everything CI would run: backend tests + frontend lint, typecheck, tests, build
	cd frontend && npm run check

demo: ## Start the example website and publish a sample item of every type (needs the stack from `make up`)
	docker compose --profile demo up -d --build mock-consumer
	docker compose --profile demo run --rm mock-consumer node seed.mjs
	@echo "Open the example website: http://localhost:$${CONSUMER_PORT:-4000}"

consumer-test: ## Unit tests of the example website's renderer (in a container)
	docker run --rm -v "$(CURDIR)/examples/mock-consumer":/app -w /app node:24-alpine node --test

clean: ## Remove build outputs
	cd backend && ./gradlew clean
	rm -rf frontend/.next
