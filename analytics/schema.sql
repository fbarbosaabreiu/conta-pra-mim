-- Eventos anônimos de uso. Não guarda IP, nome, nem localização exata:
-- só cidade/região/país que o Cloudflare deduz da conexão.
CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         TEXT NOT NULL,     -- quando chegou ao servidor (UTC, ISO 8601)
  client_ts  TEXT,              -- quando aconteceu no aparelho (UTC, ISO 8601)
  hour       INTEGER,           -- hora local do aparelho (0-23)
  dow        INTEGER,           -- dia da semana local (0 = domingo)
  device     TEXT NOT NULL,     -- código aleatório do aparelho (só existe com consentimento)
  session    TEXT NOT NULL,     -- código de cada vez que o app é aberto
  name       TEXT NOT NULL,     -- app_open, story_open, story_complete, quiz_start, quiz_complete…
  story      TEXT,
  theme      TEXT,
  value      INTEGER,
  lang       TEXT,
  country    TEXT,
  region     TEXT,
  city       TEXT,
  tz         TEXT,
  platform   TEXT,              -- iOS, Android, Windows, macOS, Linux, outro
  standalone INTEGER            -- 1 = aberto como app instalado
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS idx_events_device ON events (device);
CREATE INDEX IF NOT EXISTS idx_events_name_story ON events (name, story);

-- Catálogo de histórias enviado pelo app, para o painel mostrar também as que ninguém abriu.
CREATE TABLE IF NOT EXISTS stories (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
