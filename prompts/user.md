# Feature Specification: Quiz App Screens

---

## 1. User Data Model

When fetching a user via `GET /api/users/:id`, the following fields are returned:

```json
{
  "id": "",
  "email": "string",
  "section": "string",
  "section_id": "string",
  "current_streak": "number",
  "longest_streak": "number",
  "country": "string",
  "region": "string"
}
```

> **Note:** Do not send the `id` field in request payloads.

---

## 2. Items Screen

### Purpose
Display a paginated list of quiz items filtered by `section_id` and item `type`.

### API
**`GET /api/items`** — Returns paginated quiz items.

| Parameter    | Type    | Location | Description                                | Default |
|-------------|---------|----------|--------------------------------------------|---------|
| `type`      | string  | query    | One of: `cg`, `sc`, `co`, `la`            | —       |
| `section_id`| string  | query    | Filter items by section                    | —       |
| `universal` | boolean | query    | Use only for `cg` and `la` types          | —       |
| `page`      | number  | query    | Page number                                | `1`     |
| `limit`     | number  | query    | Results per page                           | `20`    |

### Response (when role is `user`)
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "sc",
      "year": 2024
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### UI Notes
- **Keep** the existing item card component as-is.
- **Extract** the "0/5 questions" section into a standalone component named `QuestionCardNumQuestion`. This component is not rendered on this screen — it will be used later.
- **Extract** the full test button into a standalone component named `FullTestBTN`. This component is not rendered on this screen — it will be used later.
- All other parts of the existing design remain unchanged.

---

## 3. Item Course Screen

### Purpose
When a user taps an item card, they are navigated to this screen inside a stack navigator. The screen displays a list of course buttons for that item.

### Navigation
- Uses a **stack screen** route: `item-course`
- App bar: **React Native Paper** style
  - Title: `"Cours"`
  - Back button: returns to the Items Screen

### API
**`GET /api/item-courses`** — Returns paginated course blocks.

| Parameter  | Type   | Location | Description                    | Default |
|-----------|--------|----------|--------------------------------|---------|
| `item_id` | string | query    | Filter by parent item ID       | —       |
| `page`    | number | query    | Page number                    | `1`     |
| `limit`   | number | query    | Results per page               | `20`    |

### Response
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "course": "chimie",
      "passage": "Le passage de lecture associé à ce cours…"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### UI Notes
- Each course item is rendered as a **tappable button** whose label is the value of `course`.
- The `passage` field determines whether a reading passage exists:
  - `passage.length > 0` → **no passage to show** (standard question flow)
  - `passage.length === 0` → **passage exists** and must be shown before questions (language-type item)

---

## 4. Item Questions Screen

### Purpose
Displays the quiz questions for a selected course. Tapping a course button on the Item Course Screen navigates to this screen.

### Passage Handling
- If the selected course **has a passage** (i.e., `passage.length === 0` from the course response):
  - Show the passage **before** the questions begin, as currently implemented.
  - During the question flow, **do not** display the passage inline with each question.
  - Instead, provide a **bottom sheet** that the student can open at any time to read the passage, then close to resume answering questions.
  - This is important because passages can be very long.

### API
**`GET /api/item-questions`** — Returns paginated questions.

| Parameter        | Type   | Location | Description                        | Default |
|-----------------|--------|----------|------------------------------------|---------|
| `item_course_id`| string | query    | Filter by parent item course ID    | —       |
| `page`          | number | query    | Page number                        | `1`     |
| `limit`         | number | query    | Results per page                   | `20`    |

### Response
```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "question": "Quelle est la capitale du Nord-Kivu ?",
      "options": ["bukavu", "goma"],
      "answer": 1
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

### Question Feedback (replaces end-of-quiz page)
- After the student selects an answer, provide **instant feedback**:
  - Show immediately whether the answer is correct or incorrect.
  - Display a **detailed explanation** of the correct answer.
- Do **not** navigate to a separate end-of-quiz screen after each question.

### Quiz Summary Screen (shown after all questions are answered)
- Display only:
  - **Success rate** (percentage of correct answers)
  - A **"Restart" button** — reloads the question set and starts over from the beginning
  - A **"Quit" button** — navigates back to the Item Course Screen so the student can select a different course

### Exit During Quiz
- A visible **"✕" (close) button** is present throughout the question flow.
- Tapping it navigates the student back to the **Item Course Screen** to select a different course.