-- Migration: Add year_count and question_count columns to subjects and test_year tables
-- Date: 2026-06-01

-- Add count columns to subjects table
ALTER TABLE subjects
ADD COLUMN IF NOT EXISTS year_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS question_count INTEGER NOT NULL DEFAULT 0;

-- Add question_count column to test_year table
ALTER TABLE test_year
ADD COLUMN IF NOT EXISTS question_count INTEGER NOT NULL DEFAULT 0;

-- Update year_count for all subjects based on actual test_year records
UPDATE subjects
SET year_count = (
  SELECT COUNT(*) FROM test_year WHERE test_year.subject_id = subjects.id
);

-- Update question_count for all subjects based on actual question records
UPDATE subjects
SET question_count = (
  SELECT COUNT(*) FROM questions
  WHERE questions.test_year_id IN (
    SELECT id FROM test_year WHERE test_year.subject_id = subjects.id
  )
);

-- Update question_count for all test_year records based on actual question records
UPDATE test_year
SET question_count = (
  SELECT COUNT(*) FROM questions WHERE questions.test_year_id = test_year.id
);
