# Profile API Documentation

## Overview

This document explains how to fetch and update the authenticated user's profile from the Expo app.

The backend exposes the profile API under the `profiles` resource. All profile endpoints require a valid JWT bearer token.

---

## Endpoints

### 1. Get Current User Profile

Fetch the authenticated user's profile.

```http
GET /api/profiles/me
Authorization: Bearer <JWT_TOKEN>
```

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "student@example.com",
  "section": "MÉCANIQUE GÉNÉRALE",
  "section_id": "mecanique-generale",
  "created_at": "2026-01-15T10:30:00.000Z",
  "updated_at": "2026-01-20T14:45:00.000Z"
}
```

**Field notes:**
- `id`: Profile record UUID.
- `email`: User email from the authenticated identity.
- `section`: Resolved human-readable section label.
- `section_id`: Canonical section slug used by the app. Use this when updating profile.
- `created_at` / `updated_at`: Timestamps.

**HTTP Status Codes:**
- `200` — Success
- `401` — Unauthorized (missing or invalid token)
- `500` — Server error

**Expo Usage Example:**

```ts
const apiBaseUrl = process.env.API_URL ?? 'https://api.example.com';

async function fetchProfile(token: string) {
  const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile (${response.status})`);
  }

  return response.json();
}
```

---

### 2. Update Current User Profile

Use this endpoint to update profile fields. The request is a partial PATCH, so send only the fields you want to change.

```http
PATCH /api/profiles/me
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request body:**

```json
{
  "section_id": "thermodynamique"
}
```

To clear the user's section selection:

```json
{
  "section_id": null
}
```

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "student@example.com",
  "section": "THERMODYNAMIQUE",
  "section_id": "thermodynamique",
  "created_at": "2026-01-15T10:30:00.000Z",
  "updated_at": "2026-01-20T14:55:00.000Z"
}
```

**Important:**
- `section_id` must be a slug from `GET /api/sections`.
- Use `null` to clear the section.
- Any omitted fields are left unchanged.

**HTTP Status Codes:**
- `200` — Profile updated successfully
- `400` — Validation error (invalid `section_id` or malformed request)
- `401` — Unauthorized
- `500` — Server error

**Expo Usage Example:**

```ts
async function updateProfileSection(token: string, sectionId: string | null) {
  const response = await fetch(`${apiBaseUrl}/api/profiles/me`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ section_id: sectionId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update failed (${response.status}): ${errorText}`);
  }

  return response.json();
}
```

---

## Recommended Expo flow

1. During app startup or when opening profile settings, call `GET /api/profiles/me`.
2. Display the current `section` or show a placeholder when no section is selected.
3. Load the available section catalog from `GET /api/sections`.
4. When the user chooses a new section, send `PATCH /api/profiles/me` with `section_id`.
5. If the user removes their section, send `section_id: null`.
6. Update local state with the returned profile object.

**Example React hook:**

```ts
import { useState, useEffect } from 'react';

function useUserProfile(token: string) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile(token)
      .then(setProfile)
      .catch((err) => setError(err.message));
  }, [token]);

  const saveSection = async (sectionId: string | null) => {
    const updated = await updateProfileSection(token, sectionId);
    setProfile(updated);
  };

  return { profile, saveSection, error };
}
```

---

## Notes for Expo App Integration

- Always send the JWT in the `Authorization` header.
- The backend automatically creates a profile row when the user first requests `GET /api/profiles/me`.
- Use `section_id` values from `/api/sections` to avoid invalid updates.
- Keep the profile response in local state and refresh after updates.
- Treat `section` as read-only display text and `section_id` as the canonical key.
