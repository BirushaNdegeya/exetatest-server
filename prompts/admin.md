Read AGENTS.md first and follow it strictly.

# Admin API — Feature Specification

## Overview

This document defines the admin API endpoints to be implemented. All routes live **inside the folder of their respective controller** — do not create separate admin folders. Generate usage docs for every endpoint inside the `docs/` folder.

---

## File Structure Convention

Each feature maps to an existing controller folder. Admin routes are added **within that same folder**:

```
items/
  controller.ts        ← item routes (including admin routes for items)
  ...
users/
  controller.ts        ← user routes (including admin routes for users)
  ...
docs/
  admin-stats.md
  admin-users.md
  admin-sections.md
  admin-items.md
  admin-courses.md
  admin-questions.md
```

---

## 1. Dashboard Stats

**Endpoint:** `GET /admin/stats`
**Controller location:** `sections/` folder

**Response:**

```json
{
  "totalItems": 120,
  "totalSections": 8,
  "totalUsers": 340,
  "totalAdmins": 5
}
```

| Field | Source |
|---|---|
| `totalItems` | COUNT of all rows in `items` table |
| `totalSections` | COUNT of distinct `section_id` values in `items` table |
| `totalUsers` | COUNT of all rows in `users` table |
| `totalAdmins` | COUNT of rows in `users` where `role = 'admin'` |

---

## 2. Users Management

**Controller location:** `users/` folder

### GET /admin/users

Returns a paginated, searchable, sortable list of users. Sensitive fields (OTPs, passwords) must be excluded.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20) |
| `email` | string | Partial match filter on email |
| `role` | `admin` \| `user` | Filter by role |
| `sortBy` | `createdAt` \| `email` \| `role` | Field to sort by |
| `order` | `asc` \| `desc` | Sort direction |

**Response:**

```json
{
  "users": [...],
  "total": 340,
  "page": 1,
  "totalPages": 17
}
```

### PUT /admin/users/:userId/role *(optional)*

Changes a user's role.

**Body:**

```json
{ "role": "admin" }
```

### DELETE /admin/users/:userId *(optional)*

Permanently deletes a user account.

---

## 3. Sections Management

**Endpoint:** `GET /admin/sections`
**Controller location:** `sections/` folder

Returns a list of all unique sections derived from the `items` table.

**Response:**

```json
[
  { "section_id": "math-101", "itemCount": 42 },
  { "section_id": "science-202", "itemCount": 18 }
]
```

| Field | Source |
|---|---|
| `section_id` | Distinct `section_id` values from `items` table |
| `itemCount` | COUNT of items belonging to that `section_id` |

---

## 4. Items by Section

**Endpoint:** `GET /admin/sections/:sectionId/items`
**Controller location:** `items/` folder

Returns a paginated list of items for a given section, with course counts included.

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `universal` | `true` \| `false` | Filter by the `universal` flag |
| `year` | number | Filter by year |
| `page` | number | Page number |
| `limit` | number | Results per page |

**Response:**

```json
{
  "items": [
    {
      "id": "...",
      "title": "...",
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

---

## 5. Item Courses Management (CRUD)

**Controller location:** `item-courses/` folder

### GET /admin/items/:itemId/courses
Returns all courses belonging to a specific item.

### POST /admin/items/:itemId/courses
Creates a new course for an item.

**Body:**

```json
{
  "course": "Course title",
  "passage": "Optional passage text"
}
```

### GET /admin/courses/:courseId
Returns a single course along with its associated questions.

### PUT /admin/courses/:courseId
Updates course fields (`course`, `passage`).

### DELETE /admin/courses/:courseId
Deletes the course and **cascade-deletes all its questions**.

---

## 6. Item Questions Management (CRUD)

**Controller location:** `item-questions/` folder

### GET /admin/courses/:courseId/questions
Returns all questions for a given course.

### POST /admin/courses/:courseId/questions
Creates a new question under a course.

**Body:**

```json
{
  "question": "What is the answer?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": 2
}
```

> `answer` is the zero-based index of the correct option.

### PUT /admin/questions/:questionId
Updates a question's `question`, `options`, and/or `answer` fields.

### DELETE /admin/questions/:questionId
Permanently deletes a question.

---

## Documentation Requirements

For every section above, generate a corresponding usage doc inside the `docs/` folder:

| Doc file | Covers |
|---|---|
| `docs/admin-stats.md` | Dashboard stats endpoint |
| `docs/admin-users.md` | Users list, role update, delete |
| `docs/admin-sections.md` | Sections list |
| `docs/admin-items.md` | Items by section |
| `docs/admin-courses.md` | Course CRUD |
| `docs/admin-questions.md` | Question CRUD |

Each doc should include: endpoint summary, request parameters/body, example request, and example response.