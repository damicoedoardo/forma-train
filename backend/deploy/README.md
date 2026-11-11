# Deploying the api

The api runs on the server that hosts the FORMA game, as one extra container on the game's
compose network. It reuses the game's Postgres (its own `train` database), LiteLLM and Caddy.

1. **DNS**: an A record for the api domain to the server.
2. **Code**: `git clone https://github.com/damicoedoardo/forma-train /root/forma-train`.
3. **Database**: run `setup-db.sql` once in the game's Postgres, with a new password.
4. **Coach model**: add `litellm-train.yaml` (the game's DeepSeek model under the `train-coach` name)
   to the game's LiteLLM config, restart LiteLLM, and
   make a LiteLLM key for the api.
5. **Settings**: `cp env.train.example .env.train` and fill it in.
6. **Start**: `docker compose -f compose.train.yml --env-file .env.train up -d --build`.
7. **Caddy**: add `Caddyfile.train` (with the real domain) to the game's Caddyfile, reload it.
8. **Check**: `curl https://<api domain>/health` says `{"status": "ok"}`.
9. **App**: in Vercel, set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and redeploy.

To update: `git pull` and run step 6 again.
