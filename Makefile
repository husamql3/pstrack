SHELL := /bin/sh

LOCAL_DATABASE_URL ?= postgresql://pstrack:pstrack@127.0.0.1:5433/pstrack?schema=public
LOCAL_DIRECT_URL ?= $(LOCAL_DATABASE_URL)
LOCAL_REDIS_URL ?= redis://127.0.0.1:6379
COMPOSE ?= docker compose

.DEFAULT_GOAL := help

.PHONY: help up down restart logs ps clean dev migrate seed reset studio generate check test typecheck

help:
	@echo "PStrack local aliases"
	@echo ""
	@echo "  make up         Start local Postgres + Redis"
	@echo "  make down       Stop local containers"
	@echo "  make clean      Stop containers and delete local volumes"
	@echo "  make dev        Start containers, then run the app against local Postgres"
	@echo "  make migrate    Run Prisma migrate dev against local Postgres"
	@echo "  make seed       Seed local Postgres"
	@echo "  make reset      Reset local Postgres"
	@echo "  make studio     Open DB Studio against local Postgres"
	@echo "  make check      Run Biome"
	@echo "  make test       Run Vitest"
	@echo "  make typecheck  Run Prisma generate + TypeScript"

up:
	$(COMPOSE) up -d --wait postgres redis

down:
	$(COMPOSE) down

restart: down up

logs:
	$(COMPOSE) logs -f postgres redis

ps:
	$(COMPOSE) ps

clean:
	$(COMPOSE) down -v

dev: up
	DATABASE_URL="$(LOCAL_DATABASE_URL)" DIRECT_URL="$(LOCAL_DIRECT_URL)" REDIS_URL="$(LOCAL_REDIS_URL)" bun run dev

migrate: up
	DATABASE_URL="$(LOCAL_DATABASE_URL)" DIRECT_URL="$(LOCAL_DIRECT_URL)" bun run db:migrate

seed: up
	DATABASE_URL="$(LOCAL_DATABASE_URL)" DIRECT_URL="$(LOCAL_DIRECT_URL)" bun run db:seed

reset: up
	DATABASE_URL="$(LOCAL_DATABASE_URL)" DIRECT_URL="$(LOCAL_DIRECT_URL)" bun run db:reset

studio: up
	bunx db-studio@latest --database-url "$(LOCAL_DATABASE_URL)"

generate:
	bun run db:generate

check:
	bun run check

test:
	bun run test

typecheck:
	bun run typecheck
