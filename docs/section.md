# Section API Documentation

## Overview

Sections represent logical exam subject groupings in the DRC curriculum. They are **read-only** and defined by the backend as a fixed catalog. Users select a section to organize their learning path and profile preferences.

**Key Concept:** Sections are resolved using stable slug identifiers (e.g., `mecanique-generale`). Never use free-text section names on the frontend. Always reference the canonical `section_id` from the catalog.

---

## Endpoints

### 1. List All Sections

**Fetch the complete catalog of available sections.**

```http
GET /sections
```

**Query Parameters:** None

**Response:** `200 OK`

```json
[
  {
    "id": "mecanique-generale",
    "title": "MÉCANIQUE GÉNÉRALE"
  },
  {
    "id": "thermodynamique",
    "title": "THERMODYNAMIQUE"
  },
  {
    "id": "electromagnetisme",
    "title": "ÉLECTROMAGNÉTISME"
  },
  ...
]
```

**HTTP Status Codes:**
- `200` — Success. Sections returned.
- `500` — Server error.

**Frontend Usage:**
1. Call this endpoint once on app initialization or when displaying section picker UI.
2. Cache the result locally to avoid repeated API calls.
3. Always reference the `id` field when building PATCH requests to update a profile.

---

### 2. Get Section Count

**Retrieve the total number of sections in the catalog.**

```http
GET /sections/count
```

**Query Parameters:** None

**Response:** `200 OK`

```json
{
  "count": 30
}
```

**HTTP Status Codes:**
- `200` — Success. Count returned.
- `500` — Server error.

**Frontend Usage:**
- Use this for validation or UI hints (e.g., "Choose from 30 sections").
- Optional; most frontends will just use `GET /sections` and count the array length locally.

---

## Integration with User Profiles

Sections are stored on a user's profile. To set or update a user's section, use the **profile PATCH endpoint**.

### Update User Profile with Section

```http
PATCH /profiles/me
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**

```json
{
  "section_id": "mecanique-generale"
}
```

**To clear a section:**

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
  "section": "MÉCANIQUE GÉNÉRALE",
  "section_id": "mecanique-generale",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-01-20T14:45:00Z"
}
```

**Field Descriptions:**
- `section_id` — The stable slug from `GET /sections` → `id`. **Required string or null.**
- `section` — The human-readable label (auto-resolved by backend). Read-only on response; use `section_id` for updates.

**HTTP Status Codes:**
- `200` — Success. Profile updated.
- `400` — Bad request. Invalid `section_id` or validation error.
- `401` — Unauthorized. Missing or invalid JWT.
- `404` — Profile not found (should not happen for authenticated users).
- `500` — Server error.

**Frontend Usage:**

```typescript
// 1. Fetch all sections once
const sections = await fetch('/sections').then(r => r.json());

// 2. When user selects a section from dropdown
const selectedSectionId = sections[0].id; // e.g., 'mecanique-generale'

// 3. Update profile with PATCH (partial update)
const response = await fetch('/profiles/me', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    section_id: selectedSectionId
  })
});

const updatedProfile = await response.json();
console.log('User section updated to:', updatedProfile.section);
```

---

## Frontend Checklist

- [ ] **Initialize:** Fetch and cache `GET /sections` on app startup.
- [ ] **Display:** Render section list in a dropdown/picker component.
- [ ] **Store:** Always use the `id` field (slug) when updating; never accept free-text section names.
- [ ] **Update:** Use `PATCH /profiles/me` with `{ section_id: "<slug>" }`.
- [ ] **Clear:** Send `{ section_id: null }` to remove a section assignment.
- [ ] **Error Handling:** Catch `400` errors if an invalid section slug is sent.
- [ ] **JWT Required:** All profile endpoints require Bearer token authentication.

---

## Example Flow

```
1. User opens app
   └─> Frontend calls GET /sections
   └─> Store: [
        { id: "mecanique-generale", title: "MÉCANIQUE GÉNÉRALE" },
        { id: "thermodynamique", title: "THERMODYNAMIQUE" },
        ...
      ]

2. User navigates to Profile page
   └─> Frontend calls GET /profiles/me
   └─> Renders: "Current section: MÉCANIQUE GÉNÉRALE" (or "No section selected")

3. User clicks "Change section"
   └─> Frontend renders dropdown with options from cached GET /sections response

4. User selects "THERMODYNAMIQUE"
   └─> Frontend calls PATCH /profiles/me with:
       { "section_id": "thermodynamique" }
   └─> Backend updates and returns updated profile
   └─> Frontend shows toast: "Section updated to THERMODYNAMIQUE"

5. User clicks "Remove section"
   └─> Frontend calls PATCH /profiles/me with:
       { "section_id": null }
   └─> Backend clears section and returns updated profile
```

---

## Error Handling

### Invalid Section ID

**Request:**
```json
{ "section_id": "nonexistent-section" }
```

**Response:** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": "Section introuvable",
  "error": "Bad Request"
}
```

**Frontend Handling:**
- Validate `section_id` against the cached sections list before sending.
- If validation fails, show user-friendly error: "Please select a valid section."

### Missing JWT

**Request:**
```http
PATCH /profiles/me
Content-Type: application/json

{ "section_id": "mecanique-generale" }
```

**Response:** `401 Unauthorized`
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Frontend Handling:**
- Ensure JWT is stored in `Authorization` header with `Bearer ` prefix.
- If `401` returned, redirect user to login.

---

## Best Practices

1. **Cache sections at startup:** Avoid repeated GET calls.
2. **Validate locally:** Check `section_id` against cached sections before PATCH.
3. **Use PATCH, not PUT:** Only send fields you intend to change.
4. **Handle null explicitly:** Distinguish between "not set" and user explicitly clearing.
5. **Show user feedback:** Display toast/snackbar on successful update.
6. **Error boundaries:** Wrap profile updates in try-catch; show user-friendly messages.

---

## TypeScript Types (Frontend)

```typescript
// From GET /sections
interface Section {
  id: string;        // slug: "mecanique-generale"
  title: string;     // display: "MÉCANIQUE GÉNÉRALE"
}

// For PATCH /profiles/me request
interface UpdateProfileRequest {
  section_id?: string | null;  // optional, slug or null to clear
}

// From PATCH /profiles/me response
interface ProfileResponse {
  id: string;                          // UUID
  email: string;
  section: string | null;              // auto-resolved label for display
  section_id: string | null;           // canonical slug
  created_at: string;                  // ISO 8601
  updated_at: string;                  // ISO 8601
}
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 400 "Section introuvable" | Invalid `section_id` sent | Validate against `GET /sections` results before PATCH |
| 401 Unauthorized | Missing or invalid JWT | Verify token is present and valid; re-login if needed |
| Section not updating | Using PUT instead of PATCH | Use PATCH method for partial updates |
| Cached sections stale | Backend catalog changed | Implement cache invalidation or force refresh on app update |
| `section` field null but `section_id` set | Deserialization lag | Frontend should prefer `section_id` for logic; `section` is display-only |

---

## Related Endpoints

- `GET /profiles/me` — Retrieve current user profile (includes current `section_id`).
- `PATCH /profiles/me` — Update profile; only send fields to change.
- `GET /sections` — List all available sections.
- `GET /sections/count` — Get total section count.
