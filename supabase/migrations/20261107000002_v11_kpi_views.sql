-- ============================================================
-- v1.1 phase 10 — KPI dashboard SQL (read side of events)
-- Depends on 20261107000001_v11_email_downloads.sql (events, events_daily,
-- subscribers, download_requests, paris_day()). PostgreSQL 15+.
-- Server-only: SECURITY DEFINER functions executable by service_role ONLY.
-- Idempotent (CREATE OR REPLACE). NOT applied automatically: apply after review.
-- ============================================================

-- kpi_dashboard(p_days, p_end)
--   p_days : window length in days (1..366; the UI uses 7 / 30 / 90)
--   p_end  : last Europe/Paris day of the window (default: yesterday, the last
--            complete Paris day). Previous window = the p_days days right before.
--
-- Returns ONE jsonb document so the page costs a single round trip (A11):
--   range, has_data, totals{views,downloads,requests,bytes,visitor_days,signups},
--   subscribers, daily[], sub_series[], funnel, top_favorites[], top_downloads[],
--   top_albums[], day_night, devices
--
-- Sources and rules
--   * Counts (views, downloads, requests, select_add, bytes) = raw `events`
--     UNION ALL `events_daily` (the rollup written by purge_old_events), so
--     ranges older than the 13-month raw retention still work for counts.
--     purge_old_events moves rows atomically, so nothing is counted twice.
--   * DISTINCT metrics (visitor-days, distinct request_id for link_open and
--     download) need raw rows: they are 0 for days whose raw rows were purged.
--   * Days are Europe/Paris days (paris_day()), never UTC.
--   * Funnel step 1 counts visitor-days; steps 2-4 count requests (labelled in UI).
--   * bytes = bytes of `download` events only (no CDN image traffic).
CREATE OR REPLACE FUNCTION public.kpi_dashboard(p_days int DEFAULT 30, p_end date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_end     date;
  v_start   date;
  v_pend    date;
  v_pstart  date;
  v_lo      timestamptz;
  v_plo     timestamptz;
  v_hi      timestamptz;
  v_base    bigint;
  v_result  jsonb;
BEGIN
  IF p_days IS NULL OR p_days < 1 OR p_days > 366 THEN
    RAISE EXCEPTION 'p_days must be between 1 and 366';
  END IF;

  v_end    := coalesce(p_end, public.paris_day(now()) - 1);
  v_start  := v_end - (p_days - 1);
  v_pend   := v_start - 1;
  v_pstart := v_pend - (p_days - 1);
  v_plo    := v_pstart::timestamp AT TIME ZONE 'Europe/Paris';
  v_lo     := v_start::timestamp  AT TIME ZONE 'Europe/Paris';
  v_hi     := (v_end + 1)::timestamp AT TIME ZONE 'Europe/Paris';

  -- confirmed subscribers at the start of the window (growth baseline)
  SELECT
    (SELECT count(*) FROM public.subscribers
      WHERE confirmed_at IS NOT NULL AND public.paris_day(confirmed_at) < v_start)
  - (SELECT count(*) FROM public.subscribers
      WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NOT NULL
        AND public.paris_day(unsubscribed_at) < v_start)
  INTO v_base;

  WITH c AS (
    SELECT public.paris_day(created_at) AS day, type, album_id, photo_id, is_day, device,
           1::bigint AS cnt, coalesce(bytes, 0)::bigint AS bytes
      FROM public.events
     WHERE created_at >= v_plo AND created_at < v_hi
    UNION ALL
    SELECT day, type, album_id, photo_id, is_day, device, count, bytes
      FROM public.events_daily
     WHERE day BETWEEN v_pstart AND v_end
  ),
  cur AS (SELECT * FROM c WHERE day BETWEEN v_start AND v_end),
  prv AS (SELECT * FROM c WHERE day BETWEEN v_pstart AND v_pend),
  raw AS (
    SELECT public.paris_day(created_at) AS day, type, visitor_hash, request_id
      FROM public.events
     WHERE created_at >= v_lo AND created_at < v_hi
  ),
  rawp AS (
    SELECT public.paris_day(created_at) AS day, type, visitor_hash
      FROM public.events
     WHERE created_at >= v_plo AND created_at < v_lo
  ),
  days AS (SELECT (v_start + g)::date AS dd FROM generate_series(0, p_days - 1) AS g),
  daily AS (
    SELECT dd.dd AS day,
           coalesce(sum(cur.cnt) FILTER (WHERE cur.type = 'view'), 0)::bigint     AS views,
           coalesce(sum(cur.cnt) FILTER (WHERE cur.type = 'download'), 0)::bigint AS downloads
      FROM days dd LEFT JOIN cur ON cur.day = dd.dd
     GROUP BY dd.dd
  ),
  sub_ev AS (
    SELECT public.paris_day(confirmed_at) AS dd, 1 AS delta
      FROM public.subscribers
     WHERE confirmed_at IS NOT NULL AND public.paris_day(confirmed_at) BETWEEN v_start AND v_end
    UNION ALL
    SELECT public.paris_day(unsubscribed_at), -1
      FROM public.subscribers
     WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NOT NULL
       AND public.paris_day(unsubscribed_at) BETWEEN v_start AND v_end
  ),
  sub_series AS (
    SELECT dd.dd AS day,
           v_base + (SELECT coalesce(sum(e.delta), 0) FROM sub_ev e WHERE e.dd <= dd.dd) AS total
      FROM days dd
  ),
  fav AS (
    SELECT photo_id, sum(cnt)::bigint AS n, max(day) AS last_day
      FROM cur WHERE type = 'select_add' AND photo_id IS NOT NULL
     GROUP BY photo_id ORDER BY n DESC, last_day DESC, photo_id LIMIT 5
  ),
  dl AS (
    SELECT photo_id, sum(cnt)::bigint AS n, max(day) AS last_day
      FROM cur WHERE type = 'download' AND photo_id IS NOT NULL
     GROUP BY photo_id ORDER BY n DESC, last_day DESC, photo_id LIMIT 5
  ),
  alb AS (
    SELECT album_id,
           coalesce(sum(cnt) FILTER (WHERE type = 'view'), 0)::bigint     AS views,
           coalesce(sum(cnt) FILTER (WHERE type = 'download'), 0)::bigint AS downloads
      FROM cur WHERE album_id IS NOT NULL AND type IN ('view', 'download')
     GROUP BY album_id ORDER BY views DESC, downloads DESC, album_id LIMIT 5
  )
  SELECT jsonb_build_object(
    'range', jsonb_build_object('start', v_start, 'end', v_end, 'prev_start', v_pstart, 'prev_end', v_pend, 'days', p_days),
    'has_data', (EXISTS (SELECT 1 FROM public.events) OR EXISTS (SELECT 1 FROM public.events_daily)
                 OR EXISTS (SELECT 1 FROM public.subscribers)),
    'totals', jsonb_build_object(
      'views',     jsonb_build_object('cur', coalesce((SELECT sum(cnt) FROM cur WHERE type = 'view'), 0),
                                      'prev', coalesce((SELECT sum(cnt) FROM prv WHERE type = 'view'), 0)),
      'downloads', jsonb_build_object('cur', coalesce((SELECT sum(cnt) FROM cur WHERE type = 'download'), 0),
                                      'prev', coalesce((SELECT sum(cnt) FROM prv WHERE type = 'download'), 0)),
      'requests',  jsonb_build_object('cur', coalesce((SELECT sum(cnt) FROM cur WHERE type = 'request'), 0),
                                      'prev', coalesce((SELECT sum(cnt) FROM prv WHERE type = 'request'), 0)),
      'bytes',     jsonb_build_object('cur', coalesce((SELECT sum(bytes) FROM cur WHERE type = 'download'), 0),
                                      'prev', coalesce((SELECT sum(bytes) FROM prv WHERE type = 'download'), 0)),
      'visitor_days', jsonb_build_object(
        'cur',  (SELECT count(DISTINCT (visitor_hash, day)) FROM raw  WHERE type = 'view' AND visitor_hash IS NOT NULL),
        'prev', (SELECT count(DISTINCT (visitor_hash, day)) FROM rawp WHERE type = 'view' AND visitor_hash IS NOT NULL)),
      'signups', jsonb_build_object(
        'cur',  (SELECT count(*) FROM public.subscribers
                  WHERE consent_at IS NOT NULL AND public.paris_day(consent_at) BETWEEN v_start AND v_end),
        'prev', (SELECT count(*) FROM public.subscribers
                  WHERE consent_at IS NOT NULL AND public.paris_day(consent_at) BETWEEN v_pstart AND v_pend),
        'confirmed', (SELECT count(*) FROM public.subscribers
                  WHERE consent_at IS NOT NULL AND status = 'confirmed'
                    AND public.paris_day(consent_at) BETWEEN v_start AND v_end))
    ),
    'subscribers', jsonb_build_object(
      'now',    (SELECT count(*) FROM public.subscribers WHERE status = 'confirmed'),
      'base',   v_base,
      'gained', (SELECT count(*) FROM sub_ev WHERE delta = 1),
      'lost',   (SELECT count(*) FROM sub_ev WHERE delta = -1)),
    'daily', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day, 'views', views, 'downloads', downloads) ORDER BY day)
                         FROM daily), '[]'::jsonb),
    'sub_series', coalesce((SELECT jsonb_agg(jsonb_build_object('day', day, 'total', total) ORDER BY day)
                              FROM sub_series), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'visitor_days', (SELECT count(DISTINCT (visitor_hash, day)) FROM raw WHERE type = 'view' AND visitor_hash IS NOT NULL),
      'requests',     coalesce((SELECT sum(cnt) FROM cur WHERE type = 'request'), 0),
      'links_opened', (SELECT count(DISTINCT request_id) FROM raw WHERE type = 'link_open' AND request_id IS NOT NULL),
      'downloaded',   (SELECT count(DISTINCT request_id) FROM raw WHERE type = 'download'  AND request_id IS NOT NULL)),
    'top_favorites', coalesce((
      SELECT jsonb_agg(jsonb_build_object('photo_id', f.photo_id, 'count', f.n, 'src', m.src, 'alt', m.alt,
                                          'album_title', m.album_title) ORDER BY f.n DESC, f.last_day DESC, f.photo_id)
        FROM fav f
        LEFT JOIN LATERAL (
          SELECT * FROM (
            SELECT ap.src, ap.alt, al.title AS album_title
              FROM public.album_photos ap LEFT JOIN public.albums al ON al.id = ap.album_id
             WHERE ap.id = f.photo_id
            UNION ALL
            SELECT pp.src, pp.alt, NULL::text FROM public.portfolio_photos pp WHERE pp.id = f.photo_id
          ) u LIMIT 1) m ON true), '[]'::jsonb),
    'top_downloads', coalesce((
      SELECT jsonb_agg(jsonb_build_object('photo_id', f.photo_id, 'count', f.n, 'src', m.src, 'alt', m.alt,
                                          'album_title', m.album_title) ORDER BY f.n DESC, f.last_day DESC, f.photo_id)
        FROM dl f
        LEFT JOIN LATERAL (
          SELECT * FROM (
            SELECT ap.src, ap.alt, al.title AS album_title
              FROM public.album_photos ap LEFT JOIN public.albums al ON al.id = ap.album_id
             WHERE ap.id = f.photo_id
            UNION ALL
            SELECT pp.src, pp.alt, NULL::text FROM public.portfolio_photos pp WHERE pp.id = f.photo_id
          ) u LIMIT 1) m ON true), '[]'::jsonb),
    'top_albums', coalesce((
      SELECT jsonb_agg(jsonb_build_object('album_id', a.album_id, 'title', al.title, 'is_public', coalesce(al.is_public, true),
                                          'views', a.views, 'downloads', a.downloads)
                       ORDER BY a.views DESC, a.downloads DESC, a.album_id)
        FROM alb a LEFT JOIN public.albums al ON al.id = a.album_id), '[]'::jsonb),
    'day_night', jsonb_build_object(
      'day',   coalesce((SELECT sum(cnt) FROM cur WHERE type = 'view' AND is_day IS TRUE), 0),
      'night', coalesce((SELECT sum(cnt) FROM cur WHERE type = 'view' AND is_day IS FALSE), 0)),
    'devices', jsonb_build_object(
      'mobile',  coalesce((SELECT sum(cnt) FROM cur WHERE type = 'view' AND device = 'mobile'), 0),
      'tablet',  coalesce((SELECT sum(cnt) FROM cur WHERE type = 'view' AND device = 'tablet'), 0),
      'desktop', coalesce((SELECT sum(cnt) FROM cur WHERE type = 'view' AND (device = 'desktop' OR device IS NULL
                                                                           OR device NOT IN ('mobile', 'tablet'))), 0))
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.kpi_dashboard(int, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kpi_dashboard(int, date) TO service_role;
