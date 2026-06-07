-- Initial schema for EXETATEST API
-- Generated from src/models/ (users, otps, items, item_courses, item_questions)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "enum_users_role" AS ENUM ('admin', 'user');
CREATE TYPE "enum_items_type" AS ENUM ('cg', 'sc', 'co', 'la');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "country" VARCHAR(255),
  "region" VARCHAR(255),
  "section" VARCHAR(255),
  "section_id" VARCHAR(64),
  "role" "enum_users_role" NOT NULL DEFAULT 'user',
  "current_streak" INTEGER NOT NULL DEFAULT 0,
  "longest_streak" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "otps" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "code" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "otps_user_id" ON "otps" ("userId");

CREATE TABLE "items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" "enum_items_type" NOT NULL,
  "section_id" VARCHAR(64) NOT NULL,
  "year" INTEGER NOT NULL,
  "universal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "item_courses" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "course" VARCHAR(128) NOT NULL,
  "item_id" UUID NOT NULL REFERENCES "items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "passage" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "item_courses_item_id" ON "item_courses" ("item_id");

CREATE TABLE "item_questions" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "question" VARCHAR(255) NOT NULL,
  "item_course_id" UUID NOT NULL REFERENCES "item_courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "options" VARCHAR(255)[] NOT NULL,
  "answer" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "item_questions_item_course_id" ON "item_questions" ("item_course_id");
