-- ============================================================
-- v1.1 audit batch 2 (phases 6/7/10) — NEW migration, NOT applied automatically.
-- Depends on 20261107000001 + 20261107000002 (already applied in prod).
-- Idempotent (IF NOT EXISTS / CREATE OR REPLACE). Apply after review.
--
--  1. rate_limits(window_start) index: the opportunistic cleanup in rate_limit_hit
--     (DELETE ... WHERE window_start < ...) and the retention purge scan this column.
--  2. events(request_id) partial index: the funnel cohort join.
--  3. kpi_dashboard rewritten (CREATE OR REPLACE, same signature + same JSON shape):
--     * M2 performance: ONE materialised pass over the two windows feeding ONE
--       FILTERed aggregate (was ~20 separate scans of a materialised CTE);
--       visitor-days counted ONCE per window with a scalar text key
--       (count(DISTINCT visitor_hash || day) instead of the row-constructor
--       DISTINCT (visitor_hash, day), which sorts records and was computed twice).
--     * M3 funnel: links_opened / downloaded are a COHORT of the requests created
--       in the window (joined by request_id on the 'request' events), so
--       conversion can never exceed 100%. funnel.requests is that same cohort
--       (distinct request_id of raw 'request' events). Step 1 (visitor-days) is
--       still a different unit.
--     * Hot paths use the inline expression (created_at AT TIME ZONE 'Europe/Paris')::date instead of
--       paris_day(): a function with a SET clause cannot be inlined, so it was called ~4x per row.
--       Function-local work_mem = 64MB lets the pre-aggregations hash instead of spilling a sort to disk.
--     * Same totals / daily / sub_series / top_* / day_night / devices as before.
--  H1 (/api/track inflation) needs NO schema change: views are now written with an
--  IP-only visitor_hash, so the existing events_view_dedupe_idx
--  (target, visitor_hash, Paris day) already allows 1 row per IP per target per day.
-- ============================================================

CREATE INDEX IF NOT EXISTS rate_limits_window_start_idx ON public.rate_limits (window_start);

CREATE INDEX IF NOT EXISTS events_request_id_idx ON public.events (request_id) WHERE request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.kpi_dashboard(p_days int DEFAULT 30, p_end date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
SET work_mem = '64MB'
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

  WITH g AS MATERIALIZED (
    -- ONE streaming pass over raw events + rollup of both windows, pre-aggregated to a few
    -- thousand rows (no photo_id / visitor_hash: those are handled by narrower queries below).
    -- link_open is only needed by the funnel cohort.
    SELECT day, type, album_id, is_day, device, sum(cnt)::bigint AS cnt, sum(bytes)::bigint AS bytes
      FROM (
        SELECT (created_at AT TIME ZONE 'Europe/Paris')::date AS day, type, album_id, is_day, device,
               1::bigint AS cnt, coalesce(bytes, 0)::bigint AS bytes
          FROM public.events
         WHERE created_at >= v_plo AND created_at < v_hi
           AND type IN ('view', 'select_add', 'request', 'download')
        UNION ALL
        SELECT day, type, album_id, is_day, device, count, bytes
          FROM public.events_daily
         WHERE day BETWEEN v_pstart AND v_end
           AND type IN ('view', 'select_add', 'request', 'download')
      ) u
     GROUP BY day, type, album_id, is_day, device
  ),
  -- visitor-days (raw rows only: the rollup has no visitor_hash), counted ONCE per window with a
  -- scalar text key (hash-aggregated), never a row-constructor DISTINCT.
  vd AS (
    SELECT count(*) FILTER (WHERE d >= v_start) AS cur,
           count(*) FILTER (WHERE d <  v_start) AS prev
      FROM (
        SELECT min((created_at AT TIME ZONE 'Europe/Paris')::date) AS d
          FROM public.events
         WHERE type = 'view' AND visitor_hash IS NOT NULL
           AND created_at >= v_plo AND created_at < v_hi
         GROUP BY visitor_hash || (created_at AT TIME ZONE 'Europe/Paris')::date::text
      ) k
  ),
  tot AS (
    SELECT
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'view'), 0)     AS views_cur,
      coalesce(sum(cnt) FILTER (WHERE day <  v_start AND type = 'view'), 0)     AS views_prev,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'download'), 0) AS dl_cur,
      coalesce(sum(cnt) FILTER (WHERE day <  v_start AND type = 'download'), 0) AS dl_prev,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'request'), 0)  AS req_cur,
      coalesce(sum(cnt) FILTER (WHERE day <  v_start AND type = 'request'), 0)  AS req_prev,
      coalesce(sum(bytes) FILTER (WHERE day >= v_start AND type = 'download'), 0) AS bytes_cur,
      coalesce(sum(bytes) FILTER (WHERE day <  v_start AND type = 'download'), 0) AS bytes_prev,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'view' AND is_day IS TRUE), 0)  AS dn_day,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'view' AND is_day IS FALSE), 0) AS dn_night,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'view' AND device = 'mobile'), 0) AS dev_mobile,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'view' AND device = 'tablet'), 0) AS dev_tablet,
      coalesce(sum(cnt) FILTER (WHERE day >= v_start AND type = 'view'
                                  AND (device = 'desktop' OR device IS NULL OR device NOT IN ('mobile', 'tablet'))), 0) AS dev_desktop
      FROM g
  ),
  -- funnel cohort (M3): requests CREATED in the window, and what became of exactly those requests
  cohort AS MATERIALIZED (
    SELECT DISTINCT request_id
      FROM public.events
     WHERE type = 'request' AND request_id IS NOT NULL
       AND created_at >= v_lo AND created_at < v_hi
  ),
  fl AS (
    SELECT count(DISTINCT e.request_id) FILTER (WHERE e.type = 'link_open') AS links_opened,
           count(DISTINCT e.request_id) FILTER (WHERE e.type = 'download')  AS downloaded
      FROM public.events e
      JOIN cohort k ON k.request_id = e.request_id
     WHERE e.type IN ('link_open', 'download') AND e.created_at >= v_lo
  ),
  days AS (SELECT (v_start + g)::date AS dd FROM generate_series(0, p_days - 1) AS g),
  dly AS (
    SELECT day,
           sum(cnt) FILTER (WHERE type = 'view')     AS views,
           sum(cnt) FILTER (WHERE type = 'download') AS downloads
      FROM g WHERE day >= v_start AND type IN ('view', 'download')
     GROUP BY day
  ),
  daily AS (
    SELECT dd.dd AS day, coalesce(d.views, 0)::bigint AS views, coalesce(d.downloads, 0)::bigint AS downloads
      FROM days dd LEFT JOIN dly d ON d.day = dd.dd
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
      FROM (
        SELECT photo_id, (created_at AT TIME ZONE 'Europe/Paris')::date AS day, 1::bigint AS cnt
          FROM public.events
         WHERE type = 'select_add' AND photo_id IS NOT NULL AND created_at >= v_lo AND created_at < v_hi
        UNION ALL
        SELECT photo_id, day, count FROM public.events_daily
         WHERE type = 'select_add' AND photo_id IS NOT NULL AND day BETWEEN v_start AND v_end
      ) u
     GROUP BY photo_id ORDER BY n DESC, last_day DESC, photo_id LIMIT 5
  ),
  dl AS (
    SELECT photo_id, sum(cnt)::bigint AS n, max(day) AS last_day
      FROM (
        SELECT photo_id, (created_at AT TIME ZONE 'Europe/Paris')::date AS day, 1::bigint AS cnt
          FROM public.events
         WHERE type = 'download' AND photo_id IS NOT NULL AND created_at >= v_lo AND created_at < v_hi
        UNION ALL
        SELECT photo_id, day, count FROM public.events_daily
         WHERE type = 'download' AND photo_id IS NOT NULL AND day BETWEEN v_start AND v_end
      ) u
     GROUP BY photo_id ORDER BY n DESC, last_day DESC, photo_id LIMIT 5
  ),
  alb AS (
    SELECT album_id,
           coalesce(sum(cnt) FILTER (WHERE type = 'view'), 0)::bigint     AS views,
           coalesce(sum(cnt) FILTER (WHERE type = 'download'), 0)::bigint AS downloads
      FROM g WHERE day >= v_start AND album_id IS NOT NULL AND type IN ('view', 'download')
     GROUP BY album_id ORDER BY views DESC, downloads DESC, album_id LIMIT 5
  )
  SELECT jsonb_build_object(
    'range', jsonb_build_object('start', v_start, 'end', v_end, 'prev_start', v_pstart, 'prev_end', v_pend, 'days', p_days),
    'has_data', (EXISTS (SELECT 1 FROM public.events) OR EXISTS (SELECT 1 FROM public.events_daily)
                 OR EXISTS (SELECT 1 FROM public.subscribers)),
    'totals', jsonb_build_object(
      'views',     jsonb_build_object('cur', t.views_cur, 'prev', t.views_prev),
      'downloads', jsonb_build_object('cur', t.dl_cur,    'prev', t.dl_prev),
      'requests',  jsonb_build_object('cur', t.req_cur,   'prev', t.req_prev),
      'bytes',     jsonb_build_object('cur', t.bytes_cur, 'prev', t.bytes_prev),
      'visitor_days', jsonb_build_object('cur', v.cur, 'prev', v.prev),
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
      'visitor_days', v.cur,
      'requests',     (SELECT count(*) FROM cohort),
      'links_opened', f.links_opened,
      'downloaded',   f.downloaded),
    'top_favorites', coalesce((
      SELECT jsonb_agg(jsonb_build_object('photo_id', x.photo_id, 'count', x.n, 'src', m.src, 'alt', m.alt,
                                          'album_title', m.album_title) ORDER BY x.n DESC, x.last_day DESC, x.photo_id)
        FROM fav x
        LEFT JOIN LATERAL (
          SELECT * FROM (
            SELECT ap.src, ap.alt, al.title AS album_title
              FROM public.album_photos ap LEFT JOIN public.albums al ON al.id = ap.album_id
             WHERE ap.id = x.photo_id
            UNION ALL
            SELECT pp.src, pp.alt, NULL::text FROM public.portfolio_photos pp WHERE pp.id = x.photo_id
          ) u LIMIT 1) m ON true), '[]'::jsonb),
    'top_downloads', coalesce((
      SELECT jsonb_agg(jsonb_build_object('photo_id', x.photo_id, 'count', x.n, 'src', m.src, 'alt', m.alt,
                                          'album_title', m.album_title) ORDER BY x.n DESC, x.last_day DESC, x.photo_id)
        FROM dl x
        LEFT JOIN LATERAL (
          SELECT * FROM (
            SELECT ap.src, ap.alt, al.title AS album_title
              FROM public.album_photos ap LEFT JOIN public.albums al ON al.id = ap.album_id
             WHERE ap.id = x.photo_id
            UNION ALL
            SELECT pp.src, pp.alt, NULL::text FROM public.portfolio_photos pp WHERE pp.id = x.photo_id
          ) u LIMIT 1) m ON true), '[]'::jsonb),
    'top_albums', coalesce((
      SELECT jsonb_agg(jsonb_build_object('album_id', a.album_id, 'title', al.title, 'is_public', coalesce(al.is_public, true),
                                          'views', a.views, 'downloads', a.downloads)
                       ORDER BY a.views DESC, a.downloads DESC, a.album_id)
        FROM alb a LEFT JOIN public.albums al ON al.id = a.album_id), '[]'::jsonb),
    'day_night', jsonb_build_object('day', t.dn_day, 'night', t.dn_night),
    'devices', jsonb_build_object('mobile', t.dev_mobile, 'tablet', t.dev_tablet, 'desktop', t.dev_desktop)
  )
  INTO v_result
  FROM tot t, fl f, vd v;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.kpi_dashboard(int, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.kpi_dashboard(int, date) TO service_role;
