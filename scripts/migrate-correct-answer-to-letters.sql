-- Migrates legacy INTEGER correct_answer values (1-5) to letter labels (A-E).
-- Safe to re-run: only updates rows that still use numeric indices.

BEGIN;

DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type
  INTO col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'questions'
    AND column_name = 'correct_answer';

  IF col_type IS NULL THEN
    RAISE NOTICE 'questions.correct_answer column not found; skipping';
    RETURN;
  END IF;

  IF col_type IN ('integer', 'bigint', 'smallint') THEN
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_answer_letter VARCHAR(1);

    UPDATE questions
    SET correct_answer_letter = CASE correct_answer
      WHEN 1 THEN 'A'
      WHEN 2 THEN 'B'
      WHEN 3 THEN 'C'
      WHEN 4 THEN 'D'
      WHEN 5 THEN 'E'
      ELSE 'A'
    END
    WHERE correct_answer_letter IS NULL;

    ALTER TABLE questions DROP COLUMN correct_answer;
    ALTER TABLE questions RENAME COLUMN correct_answer_letter TO correct_answer;
    ALTER TABLE questions ALTER COLUMN correct_answer SET NOT NULL;
  ELSE
    UPDATE questions
    SET correct_answer = CASE correct_answer
      WHEN '1' THEN 'A'
      WHEN '2' THEN 'B'
      WHEN '3' THEN 'C'
      WHEN '4' THEN 'D'
      WHEN '5' THEN 'E'
      ELSE correct_answer
    END
    WHERE correct_answer IN ('1', '2', '3', '4', '5');
  END IF;
END $$;

COMMIT;
