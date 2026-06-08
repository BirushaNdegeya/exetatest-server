# Admin — Item Questions Management

All endpoints require JWT authentication and the admin role.

## List questions for a course

`GET /admin/courses/:courseId/questions`

### Example request

```bash
curl -s http://localhost:3000/admin/courses/<courseId>/questions \
  -H "Authorization: Bearer <JWT>"
```

### Example response

```json
[
  {
    "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
    "question": "What is the answer?",
    "item_course_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 2,
    "created_at": "2024-06-02T10:00:00.000Z",
    "updated_at": "2024-06-02T10:00:00.000Z"
  }
]
```

> `answer` is the zero-based index of the correct option in `options`.

---

## Create a question

`POST /admin/courses/:courseId/questions`

### Body

```json
{
  "question": "What is the answer?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 2
}
```

### Example request

```bash
curl -s -X POST http://localhost:3000/admin/courses/<courseId>/questions \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the answer?","options":["A","B","C","D"],"answer":2}'
```

---

## Update a question

`PUT /admin/questions/:questionId`

### Body

Send only fields to change:

```json
{
  "question": "Updated question text",
  "options": ["A", "B", "C"],
  "answer": 1
}
```

---

## Delete a question

`DELETE /admin/questions/:questionId`

Permanently deletes a question. Returns `204 No Content` on success.

### Example request

```bash
curl -s -X DELETE http://localhost:3000/admin/questions/<questionId> \
  -H "Authorization: Bearer <JWT>"
```
