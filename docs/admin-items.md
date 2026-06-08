# Admin — Items by Section

## Endpoint

`GET /admin/sections/:sectionId/items`

Returns a paginated list of items for a given section, including course counts.

**Auth:** JWT required, admin role required.

## Path parameters

| Parameter | Description |
|---|---|
| `sectionId` | The `section_id` to filter items by |

## Query parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `universal` | `true` \| `false` | — | Filter by universal flag |
| `year` | number | — | Filter by exam year |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |

## Example request

```bash
curl -s "http://localhost:3000/admin/sections/mecanique-generale/items?universal=false&year=2023&page=1&limit=20" \
  -H "Authorization: Bearer <JWT>"
```

## Example response

```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "sc",
      "universal": true,
      "year": 2023,
      "courseCount": 4
    }
  ],
  "total": 50,
  "page": 1,
  "totalPages": 5
}
```
