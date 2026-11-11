from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    env: str = "development"

    # Supabase signs every login token; we only check them (JWKS), never issue them.
    supabase_issuer: str = ""
    supabase_jwks_url: str = ""
    # Only for local tests: Supabase's old shared-secret tokens. Off in production.
    supabase_jwt_secret: str = ""
    supabase_allow_legacy_hs256: bool = False

    database_url: str = "postgresql://train:train_dev@localhost:5432/train"

    # The web app's origins: local dev here; production (forma-train-one.vercel.app) and the
    # Vercel previews by the pattern. A custom app domain goes in TRAIN_CORS_ORIGINS.
    cors_origins: str = "http://localhost:3000"
    cors_origin_regex: str = r"https://forma-train(-one|-.*-edoardo-damicos-projects)?\.vercel\.app"

    # The biggest save we keep, in bytes of JSON. A real save is a few hundred KB at most.
    max_save_bytes: int = 2_000_000

    # The coach (an LLM) through the LiteLLM proxy on this server, which sends it to OpenRouter
    # (litellm-config.yaml). Empty key: the coach is off and /coach says so. Keys live only in
    # the server's .env, never in the repo.
    litellm_url: str = "http://litellm:4000"
    litellm_key: str = ""
    coach_model: str = "train-coach"
    # Messages a person may send the coach in a day, and model calls in all (tools take a few).
    coach_turns_per_day: int = 40
    coach_calls_per_day: int = 200
    # The biggest chat we pass on, in bytes of JSON; the phone keeps only the recent part.
    max_coach_bytes: int = 200_000

    model_config = {"env_prefix": "TRAIN_"}


settings = Settings()
