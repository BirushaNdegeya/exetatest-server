## Admin API — Questions & Langues authoring

These endpoints are for admins to create, update, and delete questions, and to author `Langues` passages and their questions. All admin routes require a valid JWT with an admin role.

- Header: `Authorization: Bearer <ADMIN_JWT>`
- All responses follow the `{ data: ..., message: '...' }` shape unless otherwise noted.

---

### 1) Create a single question (general / legacy)

- Method: `POST /api/questions`
- Auth: Admin JWT
- Body (JSON):

```
{
	"text": "Le dialogue social aide surtout a :",
	"options": ["A. Aggraver", "B. Trouver des solutions"],
	"correct_answer": "B",
	"category_id": "<category-uuid>",
	"exam_id": "<exam-uuid|null>",
	"section_id": null,
	"explanation": "Le dialogue social cherche un compromis."
}
```

- Notes:
	- Use this for standard questions and for legacy `passage`-per-row Langues groups (each question row can include `passage` and `passage_group`).
	- `category_id` is required. Use the Categories admin UI or `GET /api/categories` to find IDs.

---

### 2) Bulk create questions

- Method: `POST /api/questions/bulk`
- Body: JSON array of the same objects used by the single create endpoint.
- Example (curl):

```bash
curl -X POST "http://localhost:3000/api/questions/bulk" \
	-H "Authorization: Bearer $ADMIN_JWT" \
	-H "Content-Type: application/json" \
	-d '[{ "text": "Q1...", "options": ["A...","B..."], "correct_answer":"A", "category_id":"<uuid>" }, { "text": "Q2...", "options": ["A...","B..."], "correct_answer":"B", "category_id":"<uuid>" }]'
```

---

### 3) Update a question

- Method: `PUT /api/questions/:id`
- Params: `:id` — question UUID
- Body: partial `UpdateQuestionDto` (same fields as create where applicable)

---

### 4) Delete a question

- Method: `DELETE /api/questions/:id`
- Params: `:id` — question UUID

---

### 5) Preferred Langues authoring (passage + questions)

Use the passage/question tables for clean Langues content. Create the passage first, then add questions linked to it.

5.1 Create a passage

- Method: `POST /api/admin/language/passages`
- Body:

```
{
	"title": "Passage Français",
	"content": "Mon frère porte un parapluie noir...",
	"reading_time_minutes": 3,
	"language": "french"
}
```

- Response: `{ data: <language_passage_row>, message: 'Passage created' }`

5.2 Create a question for a passage

- Method: `POST /api/admin/language/passages/:id/questions`
- Params: `:id` — passage UUID
- Body:

```
{
	"text": "Pourquoi porte-t-il un parapluie ?",
	"options": ["A. ...","B. ...","C. ..."],
	"correct_answer": "B",
	"explanation": "Le texte lie le parapluie au ciel couvert."
}
```

5.3 Bulk create questions for a passage

- Method: `POST /api/admin/language/passages/:id/questions/bulk`
- Body: JSON array of question objects (same shape as single question body)

---

### 6) Legacy Langues via `questions` table (passage_group)

- If you prefer legacy bulk imports, set these fields on each question row: `question_type: 'language_passage'`, `language: 'francais'|'anglais'`, `passage_group: 'langues-2026-fr'`, and include the `passage` text on each row. The random exam endpoint will fall back to picking groups by `passage_group` when `language_passages` rows are missing.

Example bulk row for legacy import (one of three rows sharing `passage_group`):

```
{
	"category_id": "<langues-category-uuid>",
	"section_id": null,
	"question_type": "language_passage",
	"language": "francais",
	"passage_group": "langues-2026-fr",
	"passage": "Mon frère porte un parapluie noir...",
	"text": "Pourquoi porte-t-il un parapluie ?",
	"options": ["A. ...","B. ...","C. ..."],
	"correct_answer": "B"
}
```

---

### Authoring recommendations & order

- For Langues use the passage tables when possible: (1) create passage, (2) create questions linked to passage via `passage_id` (or use bulk). This keeps passages and questions decoupled and the UI simpler.
- For legacy CSV imports, create groups of 3 rows (min 2, max 5) sharing the same `passage_group` and include the `passage` text on each row.
- Options should be full strings; prefixing them with `A. ` / `B. ` is supported and helps client parsing, but the `correct_answer` is a single letter (e.g., `B`).

---

### Section constraints (Sciences `sc` & Cours d'options `co`)

- Questions for `sc` and `co` are section-specific and MUST include `section_id` on creation. They are NOT universal.
- When creating questions via the single or bulk endpoints, set `section_id` to the section slug (e.g., `mathematique`).
- The `Random Exam` endpoint reads the user's `section_id` from their profile and will return only questions matching that section for `sc`/`co` categories. If the profile lacks `section_id`, the endpoint returns HTTP 400 with a clear message.
- Admins should avoid leaving `section_id` null for `sc`/`co` questions — doing so will make them unusable in section practice flows.

### Admin UI propositions (authoring workflow)

Below are concise UI proposals for an admin interface to author questions and Langues content.

- Create Question form (single):
	- Fields: `Text` (textarea), `Options` (repeater, 2–5 rows), `Correct answer` (single-letter selector), `Category` (dropdown), `Exam` (optional dropdown), `Section` (dropdown, required only when category is section-specific), `Explanation` (textarea)
	- Validation: require `category` and `correct_answer`; require `section` when category `is_universal === false` (sc/co); enforce 2–5 options.
	- Extras: preview rendered options with letter parsing; a small badge showing `is_universal` after category select.

- Bulk import UI (CSV/JSON):
	- Upload: CSV or JSON upload field.
	- Mapping step: let admin map CSV columns to fields (`text`, `options`, `correct_answer`, `category_id`, `section_id`, `passage`, `passage_group`).
	- Validation preview: show first 5 rows with detected errors (missing category, missing section for sc/co, options count).
	- Commit: run server-side bulk create; show summary of inserted / skipped rows.

- Langues authoring UI (preferred flow):
	1. Create Passage (title, content, language, reading_time_minutes).
	2. After save, open Passage editor with a Questions tab (add / edit / bulk add questions linked by `passage_id`).
	3. Show a Passage preview (first 200 chars) in the question editor and a timer hint.

- Accessibility & convenience:
	- Inline validation errors for `section_id` when category requires it.
	- Quick-copy button to produce client-ready JSON for mobile QA.
	- Version note: show created_by + created_at on passages and question rows.

These UI proposals map directly to the API fields and help admins avoid the common mistake of creating section-specific questions without a `section_id`.

### Listing sections (API)

The server already exposes a canonical sections catalog used across the app. Admin UIs should use this list to populate the `Section` dropdown so `section_id` values are consistent.

- Method: `GET /api/sections`
- Example response (truncated):

```json
[
  {
	 "id": "mecanique-generale",
	 "name": "Mécanique générale",
	 "subjects": [ { "id": "physique", "name": "Physique" } ]
  },
  {
	 "id": "bio-chimie",
	 "name": "Bio - Chimie",
	 "subjects": [ { "id": "biologie", "name": "Biologie" } ]
  }
]
```

Use the `id` field as the `section_id` when creating `sc` or `co` questions.

---

### Admin UI flowchart: create a section-specific question (screen-by-screen)

This flow shows screens and transitions for an admin to create a question while ensuring section selection for `sc`/`co` categories.

1) `Questions List` (screen)
	- Elements: list, search, `Create Question` button
	- Action: tap `Create Question` -> navigate to `Select Category`

2) `Select Category` (screen)
	- Elements: category dropdown, search, `Next` button
	- Behavior: after category selected, client inspects `category.is_universal`
	- If category is section-specific -> client will fetch `/api/sections` to populate section dropdown on next screen
	- Action: `Next` -> navigate to `Question Editor`

3) `Question Editor` (screen)
	- Elements: `Text` (textarea), `Options` repeater (2–5), `Correct answer` radio/select, `Exam` dropdown, `Section` dropdown (visible & required only if category is section-specific), `Explanation` textarea, `Save` button
	- Validation: require options length 2–5, require `section_id` when category not universal
	- Action: `Save` -> POST `/api/questions` (include `section_id` when present)

4) `Confirmation / Preview` (screen)
	- Elements: preview of created question, `Add another` and `Back to list` buttons
	- Action: either return to `Question List` or open a blank `Question Editor`

Simple ASCII flow (left → right):

Questions List -> Select Category -> Question Editor (Section required if needed) -> Confirmation -> Questions List

Notes:
- When bulk-importing, run the same validation server-side and show a mapping/preview step listing rows missing `section_id` for `sc`/`co` before commit.
- The `Section` dropdown should show `name` for humans but send `id` (slug) to the API.

### Quick curl tests

Create passage + questions (example):

```bash
# create passage
PASSAGE_ID=$(curl -s -X POST http://localhost:3000/api/admin/language/passages \
	-H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
	-d '{"title":"Passage Français","content":"Texte...","language":"french"}' | jq -r '.data.id')

# add questions
curl -s -X POST "http://localhost:3000/api/admin/language/passages/$PASSAGE_ID/questions" \
	-H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
	-d '{"text":"Pourquoi?","options":["A. ...","B. ..."],"correct_answer":"B"}' | jq
```

---

If you want, I can add update/delete admin endpoints for language passages/questions and wire them into Swagger. Mark when ready and I'll implement them.

