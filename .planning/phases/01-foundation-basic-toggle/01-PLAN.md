---
phase: 01-foundation-basic-toggle
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20240626000001_add_is_day_to_photos.sql
  - supabase/migrations/20240626000002_add_is_day_to_albums.sql
  - supabase/migrations/20240626000003_add_is_day_indexes.sql
  - supabase/migrations/20240626000004_backfill_is_day.sql
autonomous: true

# Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths:
    - "Photos table has is_day column with default true"
    - "Albums table has is_day column with default true"
    - "Indexes exist on is_day columns for both tables"
    - "Existing records have is_day set to true"
  artifacts:
    - path: "supabase/migrations/20240626000001_add_is_day_to_photos.sql"
      provides: "Migration to add is_day column to photos table"
    - path: "supabase/migrations/20240626000002_add_is_day_to_albums.sql"
      provides: "Migration to add is_day column to albums table"
    - path: "supabase/migrations/20240626000003_add_is_day_indexes.sql"
      provides: "Migration to add indexes on is_day columns"
    - path: "supabase/migrations/20240626000004_backfill_is_day.sql"
      provides: "Migration to backfill existing records"
  key_links:
    - from: "supabase/migrations/20240626000001_add_is_day_to_photos.sql"
      to: "supabase"
      via: "Supabase migration system"
      pattern: "INSERT INTO supabase.migrations"
    - from: "supabase/migrations/20240626000002_add_is_day_to_albums.sql"
      to: "supabase"
      via: "Supabase migration system"
      pattern: "INSERT INTO supabase.migrations"
    - from: "supabase/migrations/20240626000003_add_is_day_indexes.sql"
      to: "supabase"
      via: "Supabase migration system"
      pattern: "INSERT INTO supabase.migrations"
    - from: "supabase/migrations/20240626000004_backfill_is_day.sql"
      to: "supabase"
      via: "Supabase migration system"
      pattern: "INSERT INTO supabase.migrations"

---
<objective>
Add is_day column to photos and albums tables with default true, add indexes, and backfill existing records.

Purpose: Establish the database schema foundation for day/night filtering functionality.
Output: Four migration files that can be applied to the Supabase database.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@supabase/schema.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create migration scripts for adding is_day column</name>
  <files>supabase/migrations/20240626000001_add_is_day_to_photos.sql, supabase/migrations/20240626000002_add_is_day_to_albums.sql</files>
  <read_first>supabase/schema.sql</read_first>
  <action>
    Create two SQL migration files:
    1. 20240626000001_add_is_day_to_photos.sql: ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT true;
    2. 20240626000002_add_is_day_to_albums.sql: ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT true;
    Use IF NOT EXISTS to ensure idempotency. Follow the existing migration naming convention in the supabase/migrations directory.
  </verify>
    - Check that the files exist and contain the correct SQL statements.
    - Run: grep -n "ALTER TABLE" supabase/migrations/20240626000001_add_is_day_to_photos.sql
    - Run: grep -n "ALTER TABLE" supabase/migrations/20240626000002_add_is_day_to_albums.sql
  </acceptance_criteria>
    - [ "supabase/migrations/20240626000001_add_is_day_to_photos.sql contains 'ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT true;'" ]
    - [ "supabase/migrations/20240626000002_add_is_day_to_albums.sql contains 'ALTER TABLE albums ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT true;'" ]
  </done>
    Migration files for adding is_day column created and verified.
</task>

<task type="auto">
  <name>Task 2: Create migration scripts for indexes and backfill</name>
  <files>supabase/migrations/20240626000003_add_is_day_indexes.sql, supabase/migrations/20240626000004_backfill_is_day.sql</files>
  <read_first>supabase/schema.sql</read_first>
  <action>
    Create two SQL migration files:
    1. 20240626000003_add_is_day_indexes.sql: 
       CREATE INDEX IF NOT EXISTS idx_photos_is_day ON photos(is_day);
       CREATE INDEX IF NOT EXISTS idx_albums_is_day ON albums(is_day);
    2. 20240626000004_backfill_is_day.sql:
       UPDATE photos SET is_day = true WHERE is_day IS NULL;
       UPDATE albums SET is_day = true WHERE is_day IS NULL;
    Use IF NOT EXISTS for indexes to ensure idempotency.
  </verify>
    - Check that the files exist and contain the correct SQL statements.
    - Run: grep -n "CREATE INDEX" supabase/migrations/20240626000003_add_is_day_indexes.sql | wc -l (should return 2)
    - Run: grep -n "UPDATE.*SET is_day = true" supabase/migrations/20240626000004_backfill_is_day.sql | wc -l (should return 2)
  </acceptance_criteria>
    - [ "supabase/migrations/20240626000003_add_is_day_indexes.sql contains 'CREATE INDEX IF NOT EXISTS idx_photos_is_day'" ]
    - [ "supabase/migrations/20240626000003_add_is_day_indexes.sql contains 'CREATE INDEX IF NOT EXISTS idx_albums_is_day'" ]
    - [ "supabase/migrations/20240626000004_backfill_is_day.sql contains 'UPDATE photos SET is_day = true WHERE is_day IS NULL;'" ]
    - [ "supabase/migrations/20240626000004_backfill_is_day.sql contains 'UPDATE albums SET is_day = true WHERE is_day IS NULL;'" ]
  </done>
    Migration files for indexes and backfill created and verified.
</task>

<task type="auto">
  <name>Task 3: Run migrations and verify schema changes</name>
  <files>supabase/migrations/</files>
  <read_first>supabase/config.toml</read_first>
  <action>
    1. Apply the migrations to the development database using Supabase CLI:
       supabase db push --link-project <your-project-ref> --dry-run
       (Note: In a real scenario, we would apply the migrations, but for safety in this environment we'll do a dry-run and then verify the schema)
    2. Alternatively, since we cannot run Supabase CLI in this environment without credentials, we will simulate by:
       - Checking the SQL syntax of each file
       - Verifying the changes would be applied correctly by examining the current schema.sql
    3. Update the schema.sql file to reflect the new columns (for reference)
  </verify>
    - Check that all migration files are valid SQL (basic syntax check)
    - Confirm that schema.sql includes the is_day columns in both tables
    - Run: npx prisma db pull (if using Prisma) or inspect the database directly if possible
    Since we cannot execute actual database commands, we'll verify by:
      1. Checking SQL syntax with: sqlite3 :memory: ".read <file>" for each file (if sqlite available) or just grep for basic validity
      2. Ensuring the migration files are in the correct order
  </acceptance_criteria>
    - [ "All migration files are valid SQL (no syntax errors)" ]
    - [ "The supabase/schema.sql file has been updated to include is_day columns in photos and albums tables" ]
    - [ "Migration files are present in supabase/migrations/ directory with correct naming" ]
  </done>
    Migrations verified and schema updated accordingly.
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] All migration files exist and contain correct SQL
- [ ] Schema reflects the added is_day columns and indexes
- [ ] No syntax errors in SQL files
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- Database schema includes is_day columns with proper defaults and indexes on both photos and albums tables
- Existing records are prepared to be backfilled to true/day
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-basic-toggle/01-SUMMARY.md`
</output>