# Admin — Dashboard Stats

## Endpoint

`GET /admin/stats`

Returns aggregate counts for the admin dashboard.

**Auth:** JWT required, admin role required.

## Example request

```bash
curl -s http://localhost:3000/admin/stats \
  -H "Authorization: Bearer <JWT>"
```

## Example response

```json
{
  "totalItems": 120,
  "totalSections": 8,
  "totalUsers": 340,
  "totalAdmins": 5
}
```

| Field | Description |
|---|---|
| `totalItems` | Total rows in the `items` table |
| `totalSections` | Distinct `section_id` values in the `items` table |
| `totalUsers` | Total rows in the `users` table |
| `totalAdmins` | Users with `role = admin` |
