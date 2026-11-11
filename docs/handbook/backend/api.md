---
type: reference
title: API
description: The FastAPI backend — every route, the Postgres tables, the TRAIN_ settings, the coach relay limits, how to run and test it, and how it is deployed.
tags: [backend, api, fastapi, postgres, coach, friends, feed]
timestamp: 2026-11-11
---

# API

`backend/` is a small FastAPI app (Python 3.12, uv). It checks Supabase login tokens (JWKS),
keeps the save backup and the social data in Postgres, and relays the coach to an LLM through
a LiteLLM proxy. Every store sits behind a small protocol with an in-memory twin, so the tests
run without a database or a key.

## Routes

| Route | What |
|---|---|
| `GET/PUT/DELETE /save` | The save backup, with `rev` checks |
| `PUT /me` | Your card and the 30 s heartbeat (name, trained_at, training, stats) |
| `GET /friends`, `POST /friends`, `POST /friends/{id}/accept`, `DELETE /friends/{id}` | Friends by code |
| `PUT /me/profile`, `PUT/DELETE /me/photo`, `GET /profiles/{id}/photo` | The profile friends see |
| `POST /cheers`, `POST /cheers/take` | A short line to a friend, mostly mid-workout |
| `POST/GET /feed`, `GET /feed/{id}/photo`, `POST /feed/{id}/flame`, comments, `DELETE` | Shared workouts |
| `POST /coach` | One coach turn: brief + chat in, the model's answer out |
| `GET /health` | `{"status": "ok"}` |

The tables are in `backend/db/init.sql` and each store's `SCHEMA` (created on start).

## Settings

Environment variables with the prefix `TRAIN_` (`app/config.py`): `TRAIN_DATABASE_URL`, the
Supabase issuer and JWKS URL, `TRAIN_CORS_ORIGINS`, `TRAIN_LITELLM_URL` / `TRAIN_LITELLM_KEY`
/ `TRAIN_COACH_MODEL`, and the coach's daily caps (40 messages, 200 model calls). Keys live only
in the server's `.env.train`. CORS allows `localhost:3000`, `forma-train-one.vercel.app` and
the Vercel previews; a custom app domain goes in `TRAIN_CORS_ORIGINS`.

## Running it

```bash
cd backend
uv sync
uv run pytest
uv run ruff check . && uv run ruff format --check .
```

## Deploying

`backend/deploy/` holds what the server needs; its `README.md` lists the steps. The api is one
extra container (`compose.train.yml`, `forma_train_api`) on the game server's compose network
(`forma_default`). It reuses the game's Postgres with its own `train` database (`setup-db.sql`),
the game's LiteLLM with a `train-coach` model entry (`litellm-train.yaml`), and the game's Caddy
with one more site block (`Caddyfile.train`). Settings go in `.env.train` from
`env.train.example`. It is not live yet: the api domain and Supabase project are still open.
