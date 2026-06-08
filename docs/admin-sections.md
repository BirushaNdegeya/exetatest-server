# Admin — Sections Management

## Endpoint

`GET /admin/sections`

Returns all unique `section_id` values from the `items` table, each with an item count.

**Auth:** JWT required, admin role required.

## Example request

```bash
curl -s http://localhost:3000/admin/sections \
  -H "Authorization: Bearer <JWT>"
```

## Example response

```json
[
  { "section_id": "math-101", "itemCount": 42 },
  { "section_id": "science-202", "itemCount": 18 }
]
```

| Field | Description |
|---|---|
| `section_id` | Distinct section identifier from the `items` table |
| `itemCount` | Number of items in that section |
