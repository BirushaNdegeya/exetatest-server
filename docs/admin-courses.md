# Admin — Item Courses Management

All endpoints require JWT authentication and the admin role.

## List courses for an item

`GET /admin/items/:itemId/courses`

### Example request

```bash
curl -s http://localhost:3000/admin/items/<itemId>/courses \
  -H "Authorization: Bearer <JWT>"
```

### Example response

```json
[
  {
    "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "course": "chimie",
    "item_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "passage": "Optional passage text",
    "created_at": "2024-06-01T10:00:00.000Z",
    "updated_at": "2024-06-01T10:00:00.000Z"
  }
]
```

---

## Create a course

`POST /admin/items/:itemId/courses`

### Body

```json
{
  "course": "Course title",
  "passage": "Optional passage text"
}
```

### Example request

```bash
curl -s -X POST http://localhost:3000/admin/items/<itemId>/courses \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"course":"chimie","passage":"Le passage de lecture…"}'
```

---

## Get a course with questions

`GET /admin/courses/:courseId`

### Example response

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "course": "chimie",
  "item_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "passage": "Optional passage text",
  "created_at": "2024-06-01T10:00:00.000Z",
  "updated_at": "2024-06-01T10:00:00.000Z",
  "questions": [
    {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "question": "What is the answer?",
      "item_course_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "options": ["A", "B", "C", "D"],
      "answer": 2,
      "created_at": "2024-06-02T10:00:00.000Z",
      "updated_at": "2024-06-02T10:00:00.000Z"
    }
  ]
}
```

---

## Update a course

`PUT /admin/courses/:courseId`

### Body

```json
{
  "course": "Updated title",
  "passage": "Updated passage"
}
```

---

## Delete a course

`DELETE /admin/courses/:courseId`

Deletes the course and **all questions** linked to it. Returns `204 No Content` on success.

### Example request

```bash
curl -s -X DELETE http://localhost:3000/admin/courses/<courseId> \
  -H "Authorization: Bearer <JWT>"
```
