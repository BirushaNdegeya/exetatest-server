Read `AGENTS.md` first and follow it strictly.

## Refactor: Consolidate profile, user-role & user-streak into User model

### Current State
- 4 separate models: `User`, `profile`, `user-role`, `user-streak`
- Each has its own routes & controllers

### Goal
- Keep **only `User` model**
- Migrate all fields/routes from deleted models into `User`

### Current User Schema
```sql
CREATE TABLE "User" (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    pays VARCHAR(100),
    province VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user', // enum user | admin
    section_id VARCHAR(50),
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0
);


Delete profile.model.ts, user-role.model.ts, user-streak.model.ts
Update all routes to use User instead of deleted models