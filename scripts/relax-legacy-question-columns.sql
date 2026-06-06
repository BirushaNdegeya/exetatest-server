-- Relaxes legacy NOT NULL constraints on questions so the new API can write `text`
-- without also populating question_text, subject_id, or year.
-- Safe to re-run.

BEGIN;

DO $$
DECLARE
  col record;
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'questions'
      AND column_name IN ('question_text', 'subject_id', 'year')
      AND is_nullable = 'NO'
  LOOP
    EXECUTE format(
      'ALTER TABLE questions ALTER COLUMN %I DROP NOT NULL',
      col.column_name
    );
  END LOOP;
END $$;

UPDATE questions
SET question_text = text
WHERE question_text IS NULL
  AND text IS NOT NULL
  AND TRIM(text) <> '';

UPDATE questions
SET text = question_text
WHERE text IS NULL
  AND question_text IS NOT NULL
  AND TRIM(question_text) <> '';

COMMIT;
