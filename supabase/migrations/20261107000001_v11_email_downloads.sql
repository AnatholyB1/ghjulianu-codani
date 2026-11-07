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
  confirm_token_hash   text,
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

-- One 'view' per (photo, visitor, Paris day).
CREATE UNIQUE INDEX IF NOT EXISTS events_view_dedupe_idx
  ON public.events (photo_id, visitor_hash, public.paris_day(created_at))
  WHERE type = 'view';

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

REVOKE ALL ON public.subscribers, public.download_requests, public.events, public.rate_limits
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.subscribers, public.download_requests, public.events, public.rate_limits
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

-- Atomically consume one use of a download link; zero rows = refused.
-- remaining = uses left AFTER this consumption.
CREATE OR REPLACE FUNCTION public.consume_download_use(p_token_hash text)
RETURNS TABLE (request_id uuid, photos jsonb, email text, remaining int)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.download_requests d
     SET used_count = d.used_count + 1
   WHERE d.token_hash = p_token_hash
     AND d.revoked_at IS NULL
     AND d.expires_at > now()
     AND d.used_count < d.max_uses
  RETURNING d.id, d.photos, d.email, (d.max_uses - d.used_count)::int;
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
  DELETE FROM public.events WHERE created_at < now() - make_interval(months => p_months);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Execute: service_role only (functions default to PUBLIC execute).
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.consume_download_use(text)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_old_events(int)          FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_download_use(text)     TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_events(int)          TO service_role;
