---
type: reference
title: API
description: The FastAPI backend — every route, the Postgres tables, the TRAIN_ settings, the coach relay limits, and how to run and test it.
tags: [backend, api, fastapi, postgres, coach, friends, feed]
timestamp: 2026-11-02
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
in the server's `.env`.

## Running it

```bash
cd backend
uv sync
uv run pytest
uv run ruff check . && uv run ruff format --check .
```

The server and deploy are not set up yet; they will go on the machine that hosts the FORMA game.
