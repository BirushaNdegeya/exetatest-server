# Admin — Items Management

All endpoints require JWT authentication and the admin role.

Base path: `/api/admin`

---

## Create an item

`POST /api/admin/items`

Creates a quiz item (test-year block) for a section. After creation, add courses with `POST /api/admin/items/:itemId/courses`.

### Body

| Field | Type | Required | Description |
|---|---|---|---|
| `type` | string | yes | Item category: `cg`, `sc`, `co`, or `la` |
| `section_id` | string | yes | DRC catalog section id (from `GET /api/admin/sections`) |
| `year` | number | yes | Exam year (1900–2100) |
| `universal` | boolean | no | Defaults to `false` |

### Type values

| Value | Meaning |
|---|---|
| `cg` | Culture générale |
| `sc` | Sciences |
| `co` | Cours d'options |
| `la` | Langues |

### Example request

```bash
curl -s -X POST http://localhost:3000/api/admin/items \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sc",
    "section_id": "08",
    "year": 2024,
    "universal": false
  }'
```

### Example response (`201 Created`)

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "sc",
  "section_id": "08",
  "year": 2024,
  "universal": false,
  "created_at": "2024-06-07T12:00:00.000Z",
  "updated_at": "2024-06-07T12:00:00.000Z"
}
```

### Errors

| Status | When |
|---|---|
| `400` | Invalid body, unknown `section_id`, or validation failed |
| `401` | Missing or invalid JWT |
| `403` | User is not an admin |

---

## List items for a section

`GET /api/admin/sections/:sectionId/items`

Returns a paginated list of items for a given section, including course counts.

### Path parameters

| Parameter | Description |
|---|---|
| `sectionId` | DRC catalog section id (e.g. `08`) |

### Query parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `universal` | `true` \| `false` | — | Filter by universal flag |
| `year` | number | — | Filter by exam year |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

### Example request

```bash
curl -s "http://localhost:3000/api/admin/sections/08/items?universal=false&year=2024&page=1&limit=20" \
  -H "Authorization: Bearer <JWT>"
```

### Example response

```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "sc",
      "universal": false,
      "year": 2024,
      "courseCount": 0
    }
  ],
  "total": 1,
  "page": 1,
  "totalPages": 1
}
```

---

## Typical admin flow

1. `GET /api/admin/sections` — pick a section
2. `POST /api/admin/items` — create an item for that section and year
3. `POST /api/admin/items/:itemId/courses` — add courses to the item
4. `POST /api/admin/courses/:courseId/questions` — add questions to each course
