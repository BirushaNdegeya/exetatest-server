# Admin — Sections Management

## Endpoint

`GET /admin/sections`

Returns the full DRC section catalog from `drc-sections.json`, each with an item count from the `items` table (`0` when a section has no items yet).

**Auth:** JWT required, admin role required.

## Example request

```bash
curl -s http://localhost:3000/admin/sections \
  -H "Authorization: Bearer <JWT>"
```

## Example response

```json
[
  { "section_id": "12", "title": "MÉCANIQUE GÉNÉRALE", "itemCount": 42 },
  { "section_id": "08", "title": "SOCIALE", "itemCount": 0 }
]
```

| Field | Description |
|---|---|
| `section_id` | DRC catalog section id (same as `GET /sections`) |
| `title` | Section display name from the catalog |
| `itemCount` | Number of items in that section |
