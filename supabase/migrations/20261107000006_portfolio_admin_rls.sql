-- ============================================================
-- v1.1 hardening: restrict write access on the portfolio tables and buckets
-- to the portfolio admins (until now: ANY authenticated user of the shared
-- Supabase project, sign-up open). NOT applied automatically: apply after review.
--
-- Scope (portfolio app only; other apps' tables and buckets are NOT touched):
--   public.albums, public.album_photos, public.portfolio_photos, public.categories
--   storage.objects policies of the buckets album-backgrounds, album-covers,
--   album-photos, portfolio-photos (insert + delete)
--
-- The allowlist below MUST stay in sync with the ADMIN_EMAILS env var of the app
-- (v1.2: move it to a table). Public SELECT policies are unchanged.
--
-- ROLLBACK (restores the previous behaviour):
--   create policy albums_auth_all on public.albums for all using (auth.role() = 'authenticated');
--   (same for album_photos_auth_all, categories_auth_all, portfolio_auth_all, and for the
--    8 storage policies: `bucket_id = '<bucket>'` for authenticated insert/delete)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_portfolio_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT lower(coalesce((SELECT auth.jwt() ->> 'email'), ''))
         = ANY (ARRAY['ghjulianu.codani2@gmail.com', 'contact@sevalys.com']);
$$;

REVOKE ALL ON FUNCTION public.is_portfolio_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_portfolio_admin() TO authenticated, service_role;

-- Tables ---------------------------------------------------------------
DROP POLICY IF EXISTS albums_auth_all ON public.albums;
CREATE POLICY albums_admin_all ON public.albums
  FOR ALL TO authenticated
  USING (public.is_portfolio_admin()) WITH CHECK (public.is_portfolio_admin());

DROP POLICY IF EXISTS album_photos_auth_all ON public.album_photos;
CREATE POLICY album_photos_admin_all ON public.album_photos
  FOR ALL TO authenticated
  USING (public.is_portfolio_admin()) WITH CHECK (public.is_portfolio_admin());

DROP POLICY IF EXISTS portfolio_auth_all ON public.portfolio_photos;
CREATE POLICY portfolio_photos_admin_all ON public.portfolio_photos
  FOR ALL TO authenticated
  USING (public.is_portfolio_admin()) WITH CHECK (public.is_portfolio_admin());

DROP POLICY IF EXISTS categories_auth_all ON public.categories;
CREATE POLICY categories_admin_all ON public.categories
  FOR ALL TO authenticated
  USING (public.is_portfolio_admin()) WITH CHECK (public.is_portfolio_admin());

-- Storage (portfolio buckets only) -----------------------------------------
DROP POLICY IF EXISTS "auth upload album-backgrounds" ON storage.objects;
CREATE POLICY "admin upload album-backgrounds" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'album-backgrounds' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth delete album-backgrounds" ON storage.objects;
CREATE POLICY "admin delete album-backgrounds" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'album-backgrounds' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth upload album-covers" ON storage.objects;
CREATE POLICY "admin upload album-covers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'album-covers' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth delete album-covers" ON storage.objects;
CREATE POLICY "admin delete album-covers" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'album-covers' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth upload album-photos" ON storage.objects;
CREATE POLICY "admin upload album-photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'album-photos' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth delete album-photos" ON storage.objects;
CREATE POLICY "admin delete album-photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'album-photos' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth upload portfolio-photos" ON storage.objects;
CREATE POLICY "admin upload portfolio-photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio-photos' AND public.is_portfolio_admin());

DROP POLICY IF EXISTS "auth delete portfolio-photos" ON storage.objects;
CREATE POLICY "admin delete portfolio-photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio-photos' AND public.is_portfolio_admin());
