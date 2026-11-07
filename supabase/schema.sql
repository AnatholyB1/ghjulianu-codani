-- ============================================================
-- Ghjulianu Codani — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase
-- ============================================================

-- 1. Catégories
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Albums
CREATE TABLE IF NOT EXISTS albums (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  slug            TEXT        NOT NULL UNIQUE,
  year            TEXT,
  category_id     UUID        REFERENCES categories(id) ON DELETE SET NULL,
  description     TEXT,
  location        TEXT,        -- lieu de l'événement
  cover_url       TEXT,        -- miniature (card)
  background_url  TEXT,        -- hero / fond
  is_day          BOOLEAN     DEFAULT TRUE,
  is_public       BOOLEAN     DEFAULT TRUE,
  access_key      TEXT,        -- non-null si album privé
  sort_order      INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS photos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  is_day      BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW
);

-- 3. Photos d'un album
CREATE TABLE IF NOT EXISTS album_photos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id    UUID        NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  src         TEXT        NOT NULL,
  width       INTEGER     DEFAULT 1200,
  height      INTEGER     DEFAULT 800,
  alt         TEXT,
  is_day      BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Photos du portfolio
CREATE TABLE IF NOT EXISTS portfolio_photos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  src         TEXT        NOT NULL,
  width       INTEGER     DEFAULT 1200,
  height      INTEGER     DEFAULT 800,
  alt         TEXT,
  is_day      BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trigger updated_at sur albums ──────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE OR REPLACE TRIGGER albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Storage buckets ────────────────────────────────────────────
-- (crée ces buckets dans Storage > New bucket)
-- Bucket "album-covers"      public: true
-- Bucket "album-backgrounds" public: true
-- Bucket "album-photos"      public: true
-- Bucket "portfolio-photos"  public: true

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums          ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_photos ENABLE ROW LEVEL SECURITY;

-- Lecture publique des catégories
CREATE POLICY "categories_public_read"  ON categories
  FOR SELECT USING (TRUE);

-- Lecture publique des albums publics
CREATE POLICY "albums_public_read" ON albums
  FOR SELECT USING (is_public = TRUE);

-- Lecture admin de tous les albums (service_role bypass ou auth)
CREATE POLICY "albums_auth_all" ON albums
  FOR ALL USING (auth.role() = 'authenticated');

-- Lecture publique des photos d'albums publics
CREATE POLICY "album_photos_public_read" ON album_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM albums a WHERE a.id = album_id AND a.is_public = TRUE
    )
  );
CREATE POLICY "album_photos_auth_all" ON album_photos
  FOR ALL USING (auth.role() = 'authenticated');

-- Lecture publique des photos du portfolio
CREATE POLICY "portfolio_public_read" ON portfolio_photos
  FOR SELECT USING (TRUE);
CREATE POLICY "portfolio_auth_all" ON portfolio_photos
  FOR ALL USING (auth.role() = 'authenticated');

-- Admin write sur catégories
CREATE POLICY "categories_auth_all" ON categories
  FOR ALL USING (auth.role() = 'authenticated');


-- ============================================================
-- v1.1 (mirrors supabase/migrations/20261107000001_v11_email_downloads.sql)
-- ============================================================
-- ============================================================
-- v1.1 — Email-gated downloads, newsletter, events, rate limits
-- Server-only data: RLS enabled, NO policies, no grants to anon/authenticated.
-- Access only through the service_role key (server code).
-- Idempotent where possible. Apply manually after review.
-- ============================================================

-- 1. subscribers ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscribers (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                text        NOT NULL UNIQUE,   -- stored lowercased by the app
  status               text        NOT NULL CHECK (status IN ('pending','confirmed','unsubscribed','suppressed')),
  lang                 text        NOT NULL DEFAULT 'fr',
  consent_text_version text,
  consent_at           timestamptz,
  confirmed_at         timestamptz,   -- set when status becomes 'confirmed' (growth KPIs)
  confirm_token_hash  text,
  confirm_expires_at   timestamptz,
  unsubscribed_at      timestamptz,
  suppressed_reason    text,
  source               text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  CONSTRAINT subscribers_email_lowercase CHECK (email = lower(email))
);

-- 2. download_requests ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.download_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  lang          text        NOT NULL DEFAULT 'fr',
  token_hash    text        NOT NULL UNIQUE,
  expires_at    timestamptz NOT NULL,
  max_uses      int         NOT NULL DEFAULT 3,
  used_count    int         NOT NULL DEFAULT 0,
  window_started_at timestamptz,  -- start of the current 15-min download session
  album_id      uuid,
  photos        jsonb       NOT NULL,  -- [{photo_id uuid, source 'album_photos'|'portfolio_photos'}]
  ip_hash       text,
  revoked_at    timestamptz,
  email_status  text        NOT NULL DEFAULT 'queued' CHECK (email_status IN ('queued','sent','failed','guarded')),
  created_at    timestamptz DEFAULT now(),
  CONSTRAINT download_requests_photos_is_array CHECK (jsonb_typeof(photos) = 'array')
);
CREATE INDEX IF NOT EXISTS download_requests_expires_idx ON public.download_requests (expires_at);
CREATE INDEX IF NOT EXISTS download_requests_email_idx   ON public.download_requests (email);

-- 3. events (append-only) ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type         text        NOT NULL CHECK (type IN ('view','select_add','request','link_open','download')),
  photo_id     uuid,
  album_id     uuid,
  request_id   uuid,
  is_day       boolean,
  device       text,
  country      text,
  visitor_hash text,
  session_key  text,
  bytes        bigint,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_created_at_idx       ON public.events (created_at);
CREATE INDEX IF NOT EXISTS events_type_created_at_idx  ON public.events (type, created_at);
CREATE INDEX IF NOT EXISTS events_photo_created_at_idx ON public.events (photo_id, created_at);

-- Day bucket in Europe/Paris. IMMUTABLE wrapper is required for an index
-- expression (timestamptz -> date otherwise depends on the session TimeZone;
-- AT TIME ZONE with a constant zone is deterministic, so IMMUTABLE is safe).
-- Harmless helper: left executable by PUBLIC so inserts by any role can evaluate the index.
CREATE OR REPLACE FUNCTION public.paris_day(ts timestamptz)
RETURNS date
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$ SELECT (ts AT TIME ZONE 'Europe/Paris')::date $$;

-- One 'view' per (target, visitor, Paris day). Album-level views (photo_id NULL)
-- are deduped too via coalesce(photo_id, album_id, nil uuid).
CREATE UNIQUE INDEX IF NOT EXISTS events_view_dedupe_idx
  ON public.events (
    (coalesce(photo_id, album_id, '00000000-0000-0000-0000-000000000000'::uuid)),
    visitor_hash,
    public.paris_day(created_at)
  )
  WHERE type = 'view';

-- Daily rollup that survives the raw-event purge (KPI history). Requires PostgreSQL 15+.
CREATE TABLE IF NOT EXISTS public.events_daily (
  day      date   NOT NULL,
  type     text   NOT NULL,
  album_id uuid,
  photo_id uuid,
  is_day   boolean,
  device   text,
  count    bigint NOT NULL DEFAULT 0,
  bytes    bigint NOT NULL DEFAULT 0,
  CONSTRAINT events_daily_key UNIQUE NULLS NOT DISTINCT (day, type, album_id, photo_id, is_day, device)
);

-- 4. rate_limits --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        int         NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);

-- 5. RLS: enabled, deliberately NO policy; privileges revoked ----------
ALTER TABLE public.subscribers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_daily      ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subscribers, public.download_requests, public.events, public.rate_limits, public.events_daily
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.subscribers, public.download_requests, public.events, public.rate_limits, public.events_daily
  TO service_role;
-- identity sequence of events (service_role inserts need it)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 6. Functions ----------------------------------------------------------

-- Atomic fixed-window counter. true = allowed (count <= limit).
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_window timestamptz;
  v_count  int;
BEGIN
  IF p_key IS NULL OR p_limit IS NULL OR p_window_seconds IS NULL OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'invalid rate_limit_hit arguments';
  END IF;

  v_window := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.rate_limits AS r (key, window_start, count)
  VALUES (p_key, v_window, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET count = r.count + 1
  RETURNING r.count INTO v_count;

  -- opportunistic cleanup of old windows (~1% of calls)
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN v_count <= p_limit;
END;
$$;

-- A "use" is a download SESSION (default 15 min window), not a single request:
-- multi-part ZIPs and retries inside an open window do not burn extra uses.
-- One atomic UPDATE (row lock serialises concurrent calls); zero rows = refused
-- (unknown token, revoked, expired, or no use left and no open window).
--   remaining   = max_uses - used_count after this call
--   window_open = true when this call REUSED an already-open window (no use consumed),
--                 false when it opened a new window (one use consumed)
CREATE OR REPLACE FUNCTION public.consume_download_use(p_token_hash text, p_window_minutes int DEFAULT 15)
RETURNS TABLE (request_id uuid, photos jsonb, email text, remaining int, window_open boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.download_requests d
     SET used_count = CASE WHEN d.window_started_at IS NOT NULL
                                AND now() - d.window_started_at <= make_interval(mins => p_window_minutes)
                           THEN d.used_count ELSE d.used_count + 1 END,
         window_started_at = CASE WHEN d.window_started_at IS NOT NULL
                                       AND now() - d.window_started_at <= make_interval(mins => p_window_minutes)
                                  THEN d.window_started_at ELSE now() END
   WHERE d.token_hash = p_token_hash
     AND d.revoked_at IS NULL
     AND d.expires_at > now()
     AND ( (d.window_started_at IS NOT NULL
            AND now() - d.window_started_at <= make_interval(mins => p_window_minutes))
           OR d.used_count < d.max_uses )
  RETURNING d.id, d.photos, d.email, (d.max_uses - d.used_count)::int,
            (d.window_started_at < now());
$$;

-- Retention purge for raw events (called by the P10 cron). Returns deleted rows.
CREATE OR REPLACE FUNCTION public.purge_old_events(p_months int DEFAULT 13)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_deleted int;
BEGIN
  IF p_months IS NULL OR p_months < 1 THEN
    RAISE EXCEPTION 'p_months must be >= 1';
  END IF;
  -- Single statement = single atomic unit: rows are rolled into events_daily
  -- and deleted together, so aggregates survive the purge (KPI-07).
  WITH del AS (
    DELETE FROM public.events
     WHERE created_at < now() - make_interval(months => p_months)
    RETURNING type, album_id, photo_id, is_day, device, bytes, created_at
  ), agg AS (
    INSERT INTO public.events_daily AS d (day, type, album_id, photo_id, is_day, device, count, bytes)
    SELECT public.paris_day(created_at), type, album_id, photo_id, is_day, device,
           count(*), coalesce(sum(bytes), 0)
      FROM del
     GROUP BY 1, 2, 3, 4, 5, 6
    ON CONFLICT ON CONSTRAINT events_daily_key
    DO UPDATE SET count = d.count + EXCLUDED.count, bytes = d.bytes + EXCLUDED.bytes
    RETURNING 1
  )
  SELECT count(*)::int INTO v_deleted FROM del;
  RETURN v_deleted;
END;
$$;

-- Execute: service_role only (functions default to PUBLIC execute).
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_download_use(text, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_old_events(int)          FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_download_use(text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_events(int)          TO service_role;
