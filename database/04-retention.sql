-- =============================================================================
-- 04-retention.sql — Optional 30-Day Data Retention Policy for Muhkam (مُحكَم)
-- =============================================================================
-- ⚠️ IMPORTANT / تنبيه هام:
-- DO NOT execute this script on the production database without explicit
-- approval from the database owner. While this script is NOT enabled on the
-- live database, the frontend UI (index.html and js/03-i18n.js) does NOT
-- promise automatic 30-day deletion to users.
-- =============================================================================

-- 1. Helper function to purge user history and completed/failed review jobs
--    older than 30 days.
CREATE OR REPLACE FUNCTION public.purge_old_muhkam_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer := 0;
  c1 integer := 0;
  c2 integer := 0;
BEGIN
  DELETE FROM public.history
  WHERE created_at < (now() - interval '30 days');
  GET DIAGNOSTICS c1 = ROW_COUNT;

  DELETE FROM public.review_jobs
  WHERE created_at < (now() - interval '30 days')
    AND status IN ('done', 'error');
  GET DIAGNOSTICS c2 = ROW_COUNT;

  deleted_count := c1 + c2;
  RETURN deleted_count;
END;
$$;

-- 2. Optional pg_cron schedule (uncomment and run ONLY after explicit owner approval):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule(
--   'muhkam-30d-retention',
--   '15 3 * * *',
--   $$SELECT public.purge_old_muhkam_records();$$
-- );
