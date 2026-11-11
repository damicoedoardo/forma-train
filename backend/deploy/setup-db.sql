-- Run once in the game's Postgres, as its superuser:
--   docker exec -i forma_postgres psql -U <superuser> < setup-db.sql
-- (pick the password first). The api makes its own tables on start (each store's SCHEMA and
-- db/init.sql), so after this nothing else is needed.
CREATE USER train WITH PASSWORD 'CHANGE_ME';
CREATE DATABASE train OWNER train;
REVOKE ALL ON DATABASE train FROM PUBLIC;
