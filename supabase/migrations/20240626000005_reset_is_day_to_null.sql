BEGIN;

UPDATE portfolio_photos SET is_day = NULL;
UPDATE albums SET is_day = NULL;

COMMIT;
