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
  cover_url       TEXT,        -- miniature (card)
  background_url  TEXT,        -- hero / fond
  is_public       BOOLEAN     DEFAULT TRUE,
  access_key      TEXT,        -- non-null si album privé
  sort_order      INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Photos d'un album
CREATE TABLE IF NOT EXISTS album_photos (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id    UUID        NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  src         TEXT        NOT NULL,
  width       INTEGER     DEFAULT 1200,
  height      INTEGER     DEFAULT 800,
  alt         TEXT,
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
