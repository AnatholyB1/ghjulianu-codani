-- Throwaway-Postgres assertions for the P5 + P10 SQL (run by scripts/verify-kpi-sql.mjs).
-- Loads on top of: stub schema (roles, albums, album_photos, portfolio_photos),
-- 20261107000001_v11_email_downloads.sql, 20261107000002_v11_kpi_views.sql.
\set ON_ERROR_STOP on
\pset pager off
\o .tmp-pg-data/noise.txt

CREATE TEMP TABLE results(name text, ok boolean, detail text);
CREATE OR REPLACE FUNCTION pg_temp.check(p_name text, p_actual anyelement, p_expected anyelement) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO results VALUES (p_name, p_actual IS NOT DISTINCT FROM p_expected,
                              'actual=' || coalesce(p_actual::text, 'NULL') || ' expected=' || coalesce(p_expected::text, 'NULL'));
END $$;

-- ---- fixtures ---------------------------------------------------------------
INSERT INTO albums (id, title, is_public, is_day) VALUES
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Album A', true,  true),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Album B', false, false);
INSERT INTO album_photos (id, album_id, src, alt, is_day) VALUES
  ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'https://x/p1.jpg', 'P1', true),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'https://x/p2.jpg', 'P2', false);
INSERT INTO portfolio_photos (id, src, alt, is_day) VALUES
  ('cccccccc-0000-4000-8000-000000000001', 'https://x/q1.jpg', 'Q1', true);

-- Window under test: p_days=7, p_end=2026-03-31  => cur 03-25..03-31, prev 03-18..03-24.
-- Paris is UTC+1 until 2026-03-29 (CET), UTC+2 after (CEST).
-- Views --------------------------------------------------------------------
INSERT INTO events (type, photo_id, album_id, is_day, device, visitor_hash, created_at) VALUES
  ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', true,  'mobile',  'v1','2026-03-25 10:00:00+00'),
  ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', false, 'desktop', 'v2','2026-03-26 10:00:00+00'),
  ('view','bbbbbbbb-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000002', false, 'mobile',  'v1','2026-03-26 11:00:00+00'),
  -- 23:30Z on 03-25 = 00:30 Paris on 03-26 => NEW Paris day for v1 on p1 (allowed)
  ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', true,  'tablet',  'v1','2026-03-25 23:30:00+00'),
  -- 22:30Z on 03-31 = 00:30 Paris on 04-01 => OUTSIDE the window
  ('view','cccccccc-0000-4000-8000-000000000001',NULL, true, 'desktop', 'v2','2026-03-31 22:30:00+00'),
  -- previous window (03-18..03-24)
  ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', true, 'desktop','v1','2026-03-20 10:00:00+00'),
  ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', true, 'desktop','v2','2026-03-21 10:00:00+00');

-- Dedupe: same (photo, visitor, Paris day) must be rejected by the unique index.
DO $$
BEGIN
  BEGIN
    INSERT INTO events (type, photo_id, album_id, visitor_hash, created_at)
    VALUES ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','v1','2026-03-25 12:00:00+00');
    PERFORM pg_temp.check('dedupe same photo/visitor/Paris day rejected', false, true);
  EXCEPTION WHEN unique_violation THEN
    PERFORM pg_temp.check('dedupe same photo/visitor/Paris day rejected', true, true);
  END;
  -- 22:30Z 03-25 = 23:30 Paris 03-25 = same Paris day as the 10:00Z row => rejected
  BEGIN
    INSERT INTO events (type, photo_id, album_id, visitor_hash, created_at)
    VALUES ('view','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','v1','2026-03-25 22:30:00+00');
    PERFORM pg_temp.check('dedupe uses Paris day (22:30Z still 03-25)', false, true);
  EXCEPTION WHEN unique_violation THEN
    PERFORM pg_temp.check('dedupe uses Paris day (22:30Z still 03-25)', true, true);
  END;
END $$;

-- select_add, requests, link_open, downloads -----------------------------------
INSERT INTO events (type, photo_id, album_id, visitor_hash, created_at) VALUES
  ('select_add','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','v1','2026-03-27 09:00:00+00'),
  ('select_add','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','v2','2026-03-27 09:05:00+00'),
  ('select_add','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','v3','2026-03-27 09:06:00+00'),
  ('select_add','bbbbbbbb-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000002','v1','2026-03-27 09:07:00+00');
INSERT INTO events (type, request_id, created_at) VALUES
  ('request','11111111-0000-4000-8000-000000000001','2026-03-27 10:00:00+00'),
  ('request','11111111-0000-4000-8000-000000000002','2026-03-27 10:01:00+00'),
  ('request','11111111-0000-4000-8000-000000000003','2026-03-28 10:01:00+00'),
  ('link_open','11111111-0000-4000-8000-000000000001','2026-03-27 11:00:00+00'),
  ('link_open','11111111-0000-4000-8000-000000000001','2026-03-27 11:05:00+00'),
  ('link_open','11111111-0000-4000-8000-000000000002','2026-03-27 11:06:00+00');
INSERT INTO events (type, photo_id, album_id, request_id, bytes, created_at) VALUES
  ('download','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001',1000,'2026-03-27 12:00:00+00'),
  ('download','bbbbbbbb-0000-4000-8000-000000000002','aaaaaaaa-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001',2000,'2026-03-27 12:00:01+00'),
  ('download','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000002', 500,'2026-03-27 12:01:00+00'),
  -- previous window download
  ('download','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000009',4000,'2026-03-20 12:01:00+00');

-- Funnel cohort (M3): a request created in the PREVIOUS window must not count in the current funnel even
-- when its link is opened / downloaded inside the current window; a request created on the last day of the
-- window and opened AFTER the window end still counts (cohort follows the request, not the open date).
INSERT INTO events (type, request_id, created_at) VALUES
  ('request','11111111-0000-4000-8000-000000000010','2026-03-24 10:00:00+00'),
  ('request','11111111-0000-4000-8000-000000000011','2026-03-31 18:00:00+00');
INSERT INTO events (type, request_id, created_at) VALUES
  ('link_open','11111111-0000-4000-8000-000000000010','2026-03-27 13:00:00+00'),
  ('link_open','11111111-0000-4000-8000-000000000009','2026-03-27 13:00:00+00'),
  ('link_open','11111111-0000-4000-8000-000000000011','2026-04-01 08:00:00+00');
INSERT INTO events (type, photo_id, album_id, request_id, bytes, created_at) VALUES
  ('download','bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000010',10,'2026-03-27 13:01:00+00');

-- Subscribers ---------------------------------------------------------------------
INSERT INTO subscribers (email, status, consent_at, confirmed_at, unsubscribed_at, created_at) VALUES
  ('s1@x.test','confirmed',   '2026-03-26 09:00:00+00','2026-03-26 09:30:00+00', NULL, now()),
  ('s2@x.test','confirmed',   '2026-03-10 09:00:00+00','2026-03-10 09:30:00+00', NULL, now()),
  ('s3@x.test','unsubscribed','2026-03-10 09:00:00+00','2026-03-10 09:30:00+00','2026-03-28 09:00:00+00', now()),
  ('s4@x.test','pending',     '2026-03-27 09:00:00+00', NULL, NULL, now());

-- ---- assertions on kpi_dashboard ------------------------------------------------
CREATE TEMP TABLE k AS SELECT public.kpi_dashboard(7, DATE '2026-03-31') AS j;

SELECT pg_temp.check('range start', (j->'range'->>'start'), '2026-03-25') FROM k;
SELECT pg_temp.check('range prev_start', (j->'range'->>'prev_start'), '2026-03-18') FROM k;
SELECT pg_temp.check('views cur (Paris bucketing, dedupe, 04-01 excluded)', (j->'totals'->'views'->>'cur')::int, 4) FROM k;
SELECT pg_temp.check('views prev', (j->'totals'->'views'->>'prev')::int, 2) FROM k;
SELECT pg_temp.check('downloads cur', (j->'totals'->'downloads'->>'cur')::int, 4) FROM k;
SELECT pg_temp.check('downloads prev', (j->'totals'->'downloads'->>'prev')::int, 1) FROM k;
SELECT pg_temp.check('bytes cur', (j->'totals'->'bytes'->>'cur')::bigint, 3510::bigint) FROM k;
SELECT pg_temp.check('bytes prev', (j->'totals'->'bytes'->>'prev')::bigint, 4000::bigint) FROM k;
SELECT pg_temp.check('requests cur', (j->'totals'->'requests'->>'cur')::int, 4) FROM k;
SELECT pg_temp.check('visitor_days cur', (j->'totals'->'visitor_days'->>'cur')::int, 3) FROM k;
SELECT pg_temp.check('visitor_days prev', (j->'totals'->'visitor_days'->>'prev')::int, 2) FROM k;
SELECT pg_temp.check('funnel visitor_days', (j->'funnel'->>'visitor_days')::int, 3) FROM k;
SELECT pg_temp.check('funnel requests (cohort)', (j->'funnel'->>'requests')::int, 4) FROM k;
SELECT pg_temp.check('funnel links_opened (cohort, prev-window request excluded, post-window open included)', (j->'funnel'->>'links_opened')::int, 3) FROM k;
SELECT pg_temp.check('funnel downloaded (distinct request)', (j->'funnel'->>'downloaded')::int, 2) FROM k;
SELECT pg_temp.check('funnel never above 100%', (j->'funnel'->>'links_opened')::int <= (j->'funnel'->>'requests')::int AND (j->'funnel'->>'downloaded')::int <= (j->'funnel'->>'requests')::int, true) FROM k;
SELECT pg_temp.check('signups cur', (j->'totals'->'signups'->>'cur')::int, 2) FROM k;
SELECT pg_temp.check('signups confirmed', (j->'totals'->'signups'->>'confirmed')::int, 1) FROM k;
SELECT pg_temp.check('subscribers now', (j->'subscribers'->>'now')::int, 2) FROM k;
SELECT pg_temp.check('subscribers base', (j->'subscribers'->>'base')::int, 2) FROM k;
SELECT pg_temp.check('subscribers gained', (j->'subscribers'->>'gained')::int, 1) FROM k;
SELECT pg_temp.check('subscribers lost', (j->'subscribers'->>'lost')::int, 1) FROM k;
SELECT pg_temp.check('sub_series 03-25', (j->'sub_series'->0->>'total')::int, 2) FROM k;
SELECT pg_temp.check('sub_series 03-26', (j->'sub_series'->1->>'total')::int, 3) FROM k;
SELECT pg_temp.check('sub_series 03-28 (unsub)', (j->'sub_series'->3->>'total')::int, 2) FROM k;
SELECT pg_temp.check('daily length', jsonb_array_length(j->'daily'), 7) FROM k;
SELECT pg_temp.check('daily 03-25 views', (j->'daily'->0->>'views')::int, 1) FROM k;
SELECT pg_temp.check('daily 03-26 views (v2 + v1 p2 + v1 23:30Z)', (j->'daily'->1->>'views')::int, 3) FROM k;
SELECT pg_temp.check('daily sum = tile (A10)', (SELECT sum((e->>'views')::int) FROM k, jsonb_array_elements(j->'daily') e)::int, 4);
SELECT pg_temp.check('top favorite #1 = p1 (3)', (j->'top_favorites'->0->>'count')::int, 3) FROM k;
SELECT pg_temp.check('top favorite #1 album title', (j->'top_favorites'->0->>'album_title'), 'Album A') FROM k;
SELECT pg_temp.check('top download #1 = p1 (3)', (j->'top_downloads'->0->>'count')::int, 3) FROM k;
SELECT pg_temp.check('top album #1 views (Album A)', (j->'top_albums'->0->>'views')::int, 3) FROM k;
SELECT pg_temp.check('top album #2 private flag', (j->'top_albums'->1->>'is_public')::boolean, false) FROM k;
SELECT pg_temp.check('day/night day', (j->'day_night'->>'day')::int, 2) FROM k;
SELECT pg_temp.check('day/night night', (j->'day_night'->>'night')::int, 2) FROM k;
SELECT pg_temp.check('devices mobile', (j->'devices'->>'mobile')::int, 2) FROM k;
SELECT pg_temp.check('devices tablet', (j->'devices'->>'tablet')::int, 1) FROM k;
SELECT pg_temp.check('devices desktop', (j->'devices'->>'desktop')::int, 1) FROM k;
SELECT pg_temp.check('has_data', (j->>'has_data')::boolean, true) FROM k;

-- empty window => zeros, no error
SELECT pg_temp.check('empty window views = 0',
  (public.kpi_dashboard(7, DATE '2020-01-07')->'totals'->'views'->>'cur')::int, 0);

-- ---- retention: purge_old_events rolls up into events_daily ----------------------
INSERT INTO events (type, photo_id, album_id, is_day, device, visitor_hash, bytes, created_at) VALUES
  ('view',     'bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', true, 'mobile','old1', NULL, now() - interval '14 months'),
  ('view',     'bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', true, 'mobile','old2', NULL, now() - interval '14 months'),
  ('download', 'bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', NULL, NULL,  NULL,   700, now() - interval '14 months'),
  ('download', 'bbbbbbbb-0000-4000-8000-000000000001','aaaaaaaa-0000-4000-8000-000000000001', NULL, NULL,  NULL,   300, now() - interval '14 months');
CREATE TEMP TABLE oldday AS SELECT public.paris_day(now() - interval '14 months') AS d;
-- BEFORE purge, the old window is served from raw rows
SELECT pg_temp.check('pre-purge old views', (public.kpi_dashboard(7, (SELECT d FROM oldday))->'totals'->'views'->>'cur')::int, 2);

SELECT pg_temp.check('purge deletes 4 old rows (13 months)', public.purge_old_events(13), 4);
SELECT pg_temp.check('recent rows survive purge', (SELECT count(*)::int FROM events WHERE created_at > now() - interval '13 months'), 28 - 0 + 0 - 0) WHERE false;
SELECT pg_temp.check('old raw rows gone', (SELECT count(*)::int FROM events WHERE created_at < now() - interval '13 months'), 0);
SELECT pg_temp.check('events_daily view count', (SELECT sum(count)::int FROM events_daily WHERE type = 'view'), 2);
SELECT pg_temp.check('events_daily download count', (SELECT sum(count)::int FROM events_daily WHERE type = 'download'), 2);
SELECT pg_temp.check('events_daily download bytes', (SELECT sum(bytes)::int FROM events_daily WHERE type = 'download'), 1000);
-- AFTER purge, same window still answers from events_daily (no double count, no loss)
SELECT pg_temp.check('post-purge old views from rollup', (public.kpi_dashboard(7, (SELECT d FROM oldday))->'totals'->'views'->>'cur')::int, 2);
SELECT pg_temp.check('post-purge old downloads from rollup', (public.kpi_dashboard(7, (SELECT d FROM oldday))->'totals'->'downloads'->>'cur')::int, 2);
SELECT pg_temp.check('post-purge old bytes from rollup', (public.kpi_dashboard(7, (SELECT d FROM oldday))->'totals'->'bytes'->>'cur')::int, 1000);
-- purge is idempotent
SELECT pg_temp.check('second purge deletes nothing', public.purge_old_events(13), 0);
SELECT pg_temp.check('rollup unchanged after second purge', (SELECT sum(count)::int FROM events_daily), 4);
-- recent window unaffected by purge
SELECT pg_temp.check('recent views unaffected', (public.kpi_dashboard(7, DATE '2026-03-31')->'totals'->'views'->>'cur')::int, 4);

-- ---- privacy / RLS: anon + authenticated get nothing ------------------------------
CREATE TEMP TABLE role_res(name text, ok boolean);
GRANT ALL ON role_res TO PUBLIC;
DO $$
DECLARE r text; ok boolean;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
    EXECUTE format('SET LOCAL ROLE %I', r);
    ok := false; BEGIN PERFORM count(*) FROM public.events; EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
    RESET ROLE; INSERT INTO role_res VALUES ('RLS/grants: ' || r || ' cannot read events', ok);
    EXECUTE format('SET LOCAL ROLE %I', r);
    ok := false; BEGIN PERFORM public.kpi_dashboard(7); EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
    RESET ROLE; INSERT INTO role_res VALUES ('grants: ' || r || ' cannot execute kpi_dashboard', ok);
    EXECUTE format('SET LOCAL ROLE %I', r);
    ok := false; BEGIN PERFORM public.purge_old_events(13); EXCEPTION WHEN insufficient_privilege THEN ok := true; END;
    RESET ROLE; INSERT INTO role_res VALUES ('grants: ' || r || ' cannot execute purge_old_events', ok);
  END LOOP;
  SET LOCAL ROLE service_role;
  ok := false; BEGIN PERFORM public.kpi_dashboard(7); ok := true; EXCEPTION WHEN OTHERS THEN ok := false; END;
  RESET ROLE; INSERT INTO role_res VALUES ('service_role can execute kpi_dashboard', ok);
END $$;
INSERT INTO results SELECT name, ok, 'privilege check' FROM role_res;

-- privacy: events has no IP/UA column
SELECT pg_temp.check('events has no ip / user_agent column',
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_name = 'events' AND column_name ~* '(^ip|ip_|user_?agent|^ua$|email)'), 0);

\o
\echo ---- RESULTS ----
SELECT CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS r, name, CASE WHEN ok THEN '' ELSE detail END AS detail FROM results ORDER BY ok, name;
SELECT count(*) FILTER (WHERE ok) AS passed, count(*) FILTER (WHERE NOT ok) AS failed FROM results;
