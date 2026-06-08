# Admin — Users Management

All endpoints require JWT authentication and the admin role.

## List users

`GET /admin/users`

Paginated, searchable, sortable list of users. OTP and password fields are never returned.

### Query parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page (max 100) |
| `email` | string | — | Partial match on email |
| `role` | `admin` \| `user` | — | Filter by role |
| `sortBy` | `createdAt` \| `email` \| `role` | `createdAt` | Sort field |
| `order` | `asc` \| `desc` | `desc` | Sort direction |

### Example request

```bash
curl -s "http://localhost:3000/admin/users?page=1&limit=20&email=example&role=user&sortBy=email&order=asc" \
  -H "Authorization: Bearer <JWT>"
```

### Example response

```json
{
  "users": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "user@example.com",
      "country": "CD",
      "region": "Nord-Kivu",
      "section": "SCIENCES",
      "section_id": "3",
      "role": "user",
      "current_streak": 2,
      "longest_streak": 5,
      "createdAt": "2024-06-01T10:00:00.000Z",
      "updatedAt": "2024-06-07T12:00:00.000Z"
    }
  ],
  "total": 340,
  "page": 1,
  "totalPages": 17
}
```

---

## Change user role

`PUT /admin/users/:userId/role`

### Body

```json
{ "role": "admin" }
```

### Example request

```bash
curl -s -X PUT http://localhost:3000/admin/users/<userId>/role \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

### Example response

Returns the updated user summary (same shape as a single entry in the list above).

---

## Delete user

`DELETE /admin/users/:userId`

Permanently deletes a user account. Returns `204 No Content` on success.

### Example request

```bash
curl -s -X DELETE http://localhost:3000/admin/users/<userId> \
  -H "Authorization: Bearer <JWT>"
```
