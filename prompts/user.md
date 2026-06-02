Read `AGENTS.md` first and follow it strictly.

## Goal

Implement the **User profile + streak** read experience and define the **inactivity email** rule, while keeping the data model simple and consistent with the existing codebase.

## Models (source of truth)

Keep these models:

- `src/models/profile.model.ts`
- `src/models/user-role.model.ts`
- `src/models/user-streak.model.ts`

Remove / stop using this model:

- `src/models/user-progress.model.ts`

## Data model requirements

### `UserStreak` (keep as-is)

Required fields (already matches current model):

```ts
{
  userId: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: Date | null;
}
```

### `Profile` changes

- Remove `xp` from `Profile` (do not expose it in API and remove the column in DB schema / sync).
- Remove any “table of sections” concept; **sections are a list**, and the profile should store only the selected section via:
  - `section_id` (canonical)
  - optional legacy `section` display copy (already present)

## API behavior

### Get current user (includes streak)

Return the authenticated user plus the streak summary:

- `longest_streak`
- `current_streak`
- `last_activity_date`

Implementation note: `UserStreak` is `unique` per `userId`, so fetch or create a default row when missing.

## Inactivity email rule (2 weeks)

Use `last_activity_date` to determine inactivity. If a user has not been active for **14 days**, send them an email reminder.

- Source of “last activity”: `user_streaks.last_activity_date`
- Delivery channel: Gmail via the existing email infrastructure (SMTP/Nodemailer)
- The email should be friendly and security-safe (no sensitive account details)
