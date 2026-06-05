# Random Practice Questions API

## Overview

Use this endpoint when a student taps a training card (Culture générale, Sciences, Langues, etc.) and starts a shuffled practice session.

The route uses **short category codes** in the query string. For section-specific categories (`sc`, `co`), the backend reads **section_id from the authenticated user's profile** (JWT) — no section query param.

**Base URL:** `{API_URL}/api` (global prefix is `api`)

**Authentication:** JWT required (`Authorization: Bearer <token>`)

---

## Endpoint

```http
GET /api/exam?category={code}
Authorization: Bearer <JWT_TOKEN>
```

### Category codes

| Code | Category | Section required |
|------|----------|------------------|
| `cg` | Culture générale | No (universal) |
| `sc` | Sciences | Yes |
| `co` | Cours d'options | Yes |
| `la` | Langues | No (passage-based) |
| `di` | Dissertation | Depends on DB category |
| `jof` | Jury oral français | Depends on DB category |
| `jo` | Jury oral | Depends on DB category |
| `joa` | Jury oral anglais | Depends on DB category |

### Optional query parameters

| Param | Description |
|-------|-------------|
| `limit` | Number of questions (`1`–`50`), or `all` for every matching question. Default: 5 for `cg`/`sc`/`co`, 5 for jury codes, 1 for `di`. Ignored for `la` (Langues uses full passage sets). |
| `year` | Filter by exam year (e.g. `2024`) |
| `exam_id` | Filter by exam UUID |

### Examples

```http
GET /api/exam?category=cg
GET /api/exam?category=sc&limit=5
GET /api/exam?category=sc&limit=all
GET /api/exam?category=co
GET /api/exam?category=la
GET /api/exam?category=cg&year=2025
```

---

## Response shape

```json
{
  "data": {
    "category": "cg",
    "category_name": "Culture generale",
    "is_universal": true,
    "section_id": null,
    "questions": [
      {
        "id": "uuid",
        "text": "La decentralisation rapproche la gestion :",
        "options": ["A. Des grandes entreprises", "B. Des citoyens", "C. Des autorites etrangeres"],
        "correct_answer": "B",
        "explanation": "..."
      }
    ]
  },
  "message": "Success"
}
```

### Langues (`category=la`)

Returns **two passage blocks** (French then English) instead of a flat `questions` list:

```json
{
  "data": {
    "category": "la",
    "category_name": "Langues",
    "is_universal": true,
    "section_id": null,
    "questions": [],
    "french": {
      "title": "Passage Français",
      "content": "Mon frère porte un parapluie noir...",
      "reading_time_minutes": 3,
      "questions": [ { "id": "...", "text": "...", "options": [], "correct_answer": "B" } ]
    },
    "english": {
      "title": "Passage Anglais",
      "content": "Sara opens the window every morning...",
      "reading_time_minutes": 3,
      "questions": [ ]
    }
  },
  "message": "Success"
}
```

---

## HTTP status codes

| Code | Meaning |
|------|---------|
| `200` | Practice set returned |
| `400` | Missing `section_id` for section-specific category (profile has no section) |
| `401` | Missing or invalid JWT |
| `404` | Unknown category code, or no questions/passages in database |

---

## Mobile UI flows

### 1. Training home (S'entraîner)

Map each card to a category code and call the API when the user taps **Commencer** / opens the card:

| UI card | API call |
|---------|----------|
| Culture générale | `GET /api/exam?category=cg` |
| Sciences | `GET /api/exam?category=sc` |
| Langues | `GET /api/exam?category=la` |
| Cours d'options | `GET /api/exam?category=co` |

Ensure the profile has `section_id` set (`PATCH /api/profiles/me`) before `sc` or `co`. The API reads it from the JWT user automatically.

### 2. Standard quiz screen (`cg`, `sc`, `co`, `di`, `jof`, `jo`, `joa`)

1. Call `GET /api/exam?category={code}`.
2. Store `data.questions` in session state.
3. Show one question at a time (see mockups): title = `question.text`, options = map `question.options` to A/B/C chips.
4. Enable **Valider** when an option is selected.
5. Compare selected letter to `question.correct_answer` locally (or send to a future submit endpoint).
6. Optionally show `question.explanation` after validation.
7. Advance until all questions are done.

**Expo example:**

```ts
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type ExamCategoryCode = 'cg' | 'sc' | 'co' | 'la' | 'di' | 'jof' | 'jo' | 'joa';

async function loadPracticeSet(token: string, category: ExamCategoryCode) {
  const res = await fetch(`${API_URL}/api/exam?category=${category}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Failed to load practice');
  }

  const body = await res.json();
  return body.data;
}

// Culture générale (5 random questions, default)
const session = await loadPracticeSet(token, 'cg');
setQuestions(session.questions);

// Full revision set — every question in the pool, still shuffled
const fullSet = await fetch(`${API_URL}/api/exam?category=cg&limit=all`, {
  headers: { Authorization: `Bearer ${token}` },
}).then((r) => r.json());
setQuestions(fullSet.data.questions);
```

### 3. Langues flow (`la`)

1. Call `GET /api/exam?category=la`.
2. **French step:** Show `data.french.title`, instruction (3 min read), and `data.french.content` in a card. Button: **Commencer les questions**.
3. Quiz on `data.french.questions` (show passage context at top if needed).
4. **English step:** Same with `data.english`.
5. Finish when both passage question sets are complete.

```ts
const langues = await loadPracticeSet(token, 'la');

// Screen 1 — Passage Français
showPassage(langues.french.title, langues.french.content, langues.french.reading_time_minutes);

// Screen 2 — Questions FR
runQuiz(langues.french.questions, { context: langues.french.content });

// Screen 3 — Passage Anglais
showPassage(langues.english.title, langues.english.content, langues.english.reading_time_minutes);

// Screen 4 — Questions EN
runQuiz(langues.english.questions, { context: langues.english.content });
```

### 4. Option labels from `options` array

Backend stores options as strings, often prefixed with the letter:

```ts
function parseOption(option: string, index: number) {
  const match = option.match(/^([A-E])\.\s*(.+)$/);
  if (match) {
    return { letter: match[1], label: match[2] };
  }
  const letter = String.fromCharCode(65 + index);
  return { letter, label: option };
}
```

Use `letter` for selection state and compare to `correct_answer`.

---

## Langues templates (challenging format)

Langues is harder than `cg` / `sc` because the student must:

1. **Read** a short passage under time pressure (about 3 minutes per language).
2. **Remember** details that are not repeated on the question screen (only a context reminder is shown).
3. **Answer inference-style questions** (why, when, who, implied meaning) — not simple word matching.
4. **Repeat the full flow in English** after finishing French.

The API always returns **one random French block** and **one random English block** per `GET /api/exam?category=la`. Plan the UI as **4 steps**, not one flat quiz.

### Screen map

| Step | Screen | Data source |
|------|--------|-------------|
| 1 | Passage Français + timer | `data.french` |
| 2 | Questions FR (with context card) | `data.french.questions` |
| 3 | Passage Anglais + timer | `data.english` |
| 4 | Questions EN (with context card) | `data.english.questions` |

---

### Full API response template (challenging session)

Use this as the contract your UI should handle. Options use letters `A`–`E`; `correct_answer` is a single letter.

```json
{
  "data": {
    "category": "la",
    "category_name": "Langues",
    "is_universal": true,
    "section_id": null,
    "questions": [],
    "french": {
      "title": "Passage Français",
      "content": "Mon frère porte un parapluie noir parce que le ciel est couvert et la pluie approche. Il marche prudemment sur le trottoir mouillé en regardant les nuages gris.",
      "reading_time_minutes": 3,
      "questions": [
        {
          "id": "uuid-fr-q1",
          "text": "Pourquoi porte-t-il un parapluie ?",
          "options": [
            "A. Parce qu'il fait nuit",
            "B. Parce que la pluie approche",
            "C. Parce qu'il fait du sport",
            "D. Parce qu'il dort",
            "E. Parce qu'il cuisine"
          ],
          "correct_answer": "B",
          "explanation": "Le texte lie le parapluie au ciel couvert et à la pluie qui approche."
        },
        {
          "id": "uuid-fr-q2",
          "text": "De quelle couleur est le parapluie ?",
          "options": [
            "A. Rouge",
            "B. Bleu",
            "C. Noir",
            "D. Vert",
            "E. Jaune"
          ],
          "correct_answer": "C",
          "explanation": "Le passage dit explicitement « un parapluie noir »."
        },
        {
          "id": "uuid-fr-q3",
          "text": "Quel temps fait-il probablement ?",
          "options": [
            "A. Il va pleuvoir",
            "B. Il neige fort",
            "C. Il fait très sec",
            "D. Il y a un tremblement de terre",
            "E. Il y a une éclipse"
          ],
          "correct_answer": "A",
          "explanation": "Ciel couvert + pluie qui approche → il va pleuvoir (inférence)."
        }
      ]
    },
    "english": {
      "title": "Passage Anglais",
      "content": "Sara opens the window every morning to let fresh air enter the room. She works near the garden and enjoys the cool breeze before class starts.",
      "reading_time_minutes": 3,
      "questions": [
        {
          "id": "uuid-en-q1",
          "text": "Why does Sara open the window?",
          "options": [
            "A. To let fresh air enter",
            "B. To break the glass",
            "C. To hide the room",
            "D. To sleep outside",
            "E. To close the door"
          ],
          "correct_answer": "A",
          "explanation": "The first sentence states she opens it to let fresh air in."
        },
        {
          "id": "uuid-en-q2",
          "text": "When does Sara open the window?",
          "options": [
            "A. Every morning",
            "B. Every night only",
            "C. Once a year",
            "D. On Monday only",
            "E. Never"
          ],
          "correct_answer": "A",
          "explanation": "« every morning » is stated directly."
        },
        {
          "id": "uuid-en-q3",
          "text": "Where does she work?",
          "options": [
            "A. Near the garden",
            "B. In the hospital",
            "C. At the airport",
            "D. On the river",
            "E. In the market"
          ],
          "correct_answer": "A",
          "explanation": "Second sentence: « She works near the garden »."
        }
      ]
    }
  },
  "message": "Success"
}
```

**Challenging question patterns to aim for when authoring content:**

| Type | French example | Skill tested |
|------|----------------|--------------|
| Cause (pourquoi) | « Pourquoi porte-t-il un parapluie ? » | Lien cause → effet dans le texte |
| Detail (qui/quoi/où) | « De quelle couleur est le parapluie ? » | Repérage d’un détail explicite |
| Inference (probablement) | « Quel temps fait-il probablement ? » | Compréhension implicite |
| Time (quand) | « Quand Sara ouvre-t-elle la fenêtre ? » | Repères temporels |
| English WH | « Why / When / Who … ? » | Même logique en anglais |

Aim for **3 questions per passage** (minimum 2, maximum 5). Mix at least one inference question per passage.

---

### Content authoring template (admin / seed)

Langues content can live in either storage shape. The API picks **`language_passages` + `language_questions` first**, then falls back to the **`questions`** table grouped by `passage_group`.

#### Option A — `language_passages` + `language_questions` (preferred)

**One passage row** + **N question rows** linked by `passage_id`.

| Field | French example | English example |
|-------|----------------|-----------------|
| `language` | `french` | `english` |
| `title` | `Passage Français` | `Passage Anglais` |
| `content` | 2–4 sentences, one concrete situation | Same level, different story |
| `reading_time_minutes` | `3` | `3` |

**Per question:**

| Field | Example |
|-------|---------|
| `text` | `Pourquoi porte-t-il un parapluie ?` |
| `options` | `["A. …", "B. …", "C. …", "D. …", "E. …"]` |
| `correct_answer` | `B` (single letter) |
| `explanation` | Short justification tied to the passage |

```text
# Authoring checklist for one Langues “year” or theme

passage_group (if using questions table): langues-2026-fr / langues-2026-en

[FRENCH PASSAGE]
content: 2-4 sentences, present tense, one character + one problem (rain, exam, market, etc.)
questions (x3):
  - Q1: Pourquoi ... ?     (cause)
  - Q2: Qui / Quoi / Où ... ? (explicit detail)
  - Q3: Quand / Comment / Quel ... ? (time or inference)

[ENGLISH PASSAGE]
content: same difficulty, different vocabulary (not a translation of FR)
questions (x3):
  - Q1: Why ... ?
  - Q2: When / Who / What ... ?
  - Q3: Where / How / Which ... ? (detail or inference)
```

#### Option B — `questions` table (legacy / bulk seed)

Same passage text on **every row** of the group; questions differ by `text`.

| Field | Value |
|-------|--------|
| `category_id` | UUID of **Langues** (`is_universal: true`) |
| `section_id` | `null` |
| `question_type` | `language_passage` |
| `language` | `francais` or `anglais` |
| `passage_group` | Stable id, e.g. `langues-2026-fr` |
| `passage` | Full passage text (repeated on each row) |
| `text` | Question sentence |
| `options` | Array of 3–5 strings with `A.` / `B.` prefixes |
| `correct_answer` | `A`–`E` |
| `exam_id` | Optional year block UUID |

```json
{
  "category_id": "<langues-category-uuid>",
  "section_id": null,
  "exam_id": "<exam-2026-uuid>",
  "text": "Pourquoi porte-t-il un parapluie ?",
  "options": [
    "A. Parce qu'il fait nuit",
    "B. Parce que la pluie approche",
    "C. Parce qu'il fait du sport",
    "D. Parce qu'il dort",
    "E. Parce qu'il cuisine"
  ],
  "correct_answer": "B",
  "explanation": "Le ciel est couvert et la pluie approche.",
  "question_type": "language_passage",
  "language": "francais",
  "passage_group": "langues-2026-fr",
  "passage": "Mon frère porte un parapluie noir parce que le ciel est couvert et la pluie approche."
}
```

Create **3 rows** with the same `passage`, `passage_group`, and `language`, then repeat for `anglais` with a new `passage_group` (e.g. `langues-2026-en`).

---

### Mobile UI template — session state

```ts
type LanguesStep =
  | 'french_passage'
  | 'french_quiz'
  | 'english_passage'
  | 'english_quiz'
  | 'done';

interface LanguesSession {
  french: PassageBlock;
  english: PassageBlock;
  step: LanguesStep;
  frenchQuestionIndex: number;
  englishQuestionIndex: number;
  frenchScore: number;
  englishScore: number;
}

function initLanguesSession(data: RandomExamSession): LanguesSession {
  return {
    french: data.french!,
    english: data.english!,
    step: 'french_passage',
    frenchQuestionIndex: 0,
    englishQuestionIndex: 0,
    frenchScore: 0,
    englishScore: 0,
  };
}
```

---

### Mobile UI template — reading screen (3 min)

Copy shown to the student (matches app mockups):

```ts
const PASSAGE_COPY = {
  french: {
    heading: 'Passage Français',
    instruction:
      'Lis attentivement pendant 3 minutes. Ensuite tu répondras seulement aux questions de ce passage.',
    cta: 'Commencer les questions',
  },
  english: {
    heading: 'Passage Anglais',
    instruction:
      'Read carefully for 3 minutes. Then you will answer only the questions for this passage.',
    cta: 'Start the questions',
  },
} as const;

function PassageScreen({
  block,
  lang,
  onStart,
}: {
  block: PassageBlock;
  lang: 'french' | 'english';
  onStart: () => void;
}) {
  const copy = PASSAGE_COPY[lang];
  const totalSeconds = block.reading_time_minutes * 60;
  // Disable CTA until timer ends OR user taps early after minimum read (optional product rule)
  return {
    header: copy.heading,
    instruction: copy.instruction,
    body: block.content,
    timerSeconds: totalSeconds,
    primaryButton: copy.cta,
    onPrimaryPress: onStart,
  };
}
```

**Timer rules (recommended for “challenging” mode):**

- Show countdown from `reading_time_minutes * 60` (default 180 s).
- Keep **Commencer les questions** disabled until timer hits `0`, or enable after 60 s minimum if you want flexibility.
- Do not show questions on the same screen as the full passage (forces memory).

---

### Mobile UI template — question screen (with context)

During the quiz, show a **short context card** (category label + passage excerpt), not the full passage again:

```tsx
// Pseudocode layout matching mockup: LANGUES + context box + question + options + Valider

function LanguesQuestionScreen({
  passageContent,
  question,
  selected,
  onSelect,
  onSubmit,
}: {
  passageContent: string;
  question: PracticeQuestion;
  selected: string | null;
  onSelect: (letter: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <Text style={styles.categoryLabel}>LANGUES</Text>

      <View style={styles.contextCard}>
        <Text numberOfLines={3}>{passageContent}</Text>
      </View>

      <Text style={styles.questionTitle}>{question.text}</Text>

      {question.options.map((raw, index) => {
        const { letter, label } = parseOption(raw, index);
        return (
          <OptionChip
            key={letter}
            letter={letter}
            label={label}
            selected={selected === letter}
            onPress={() => onSelect(letter)}
          />
        );
      })}

      <Button
        title="Valider"
        disabled={!selected}
        onPress={onSubmit}
      />
    </>
  );
}
```

**After Valider:** compare `selected === question.correct_answer`, increment score, show `explanation` in a bottom sheet, then advance index or switch step to `english_passage`.

---

### Mobile UI template — step transitions

```ts
function advanceLangues(session: LanguesSession): LanguesSession {
  const { step, french, english, frenchQuestionIndex, englishQuestionIndex } =
    session;

  if (step === 'french_passage') {
    return { ...session, step: 'french_quiz' };
  }

  if (step === 'french_quiz') {
    const lastFrench = frenchQuestionIndex >= french.questions.length - 1;
    if (!lastFrench) {
      return { ...session, frenchQuestionIndex: frenchQuestionIndex + 1 };
    }
    return { ...session, step: 'english_passage', frenchQuestionIndex: 0 };
  }

  if (step === 'english_passage') {
    return { ...session, step: 'english_quiz' };
  }

  if (step === 'english_quiz') {
    const lastEnglish = englishQuestionIndex >= english.questions.length - 1;
    if (!lastEnglish) {
      return { ...session, englishQuestionIndex: englishQuestionIndex + 1 };
    }
    return { ...session, step: 'done' };
  }

  return session;
}
```

**Results screen (optional):**

```ts
const total =
  session.french.questions.length + session.english.questions.length;
const score = session.frenchScore + session.englishScore;
// e.g. "8 / 6" if 3 FR + 3 EN
```

---

### Quick test

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/exam?category=la" | jq '.data.french, .data.english'
```

Confirm both `french` and `english` exist and each has `content` plus at least 2 `questions`.

---

## Prerequisites checklist

- [ ] User logged in (JWT in `Authorization` header).
- [ ] Profile has `section_id` for **Sciences** and **Cours d'options** (set via `PATCH /api/profiles/me`).
- [ ] Admin has created categories and questions for the branch (see Swagger **Categories** / **Questions**).
- [ ] For **Langues**, either `language_passages` + `language_questions` rows exist, or questions with `passage_group` / `passage` / `language` on the `questions` table.

---

## Related endpoints

- `GET /api/practice` — Training page bootstrap (categories, streak, profile section).
- `GET /api/profiles/me` — Read `section_id` before section-specific practice.
- `PATCH /api/profiles/me` — Set `{ "section_id": "techniques-sociales" }`.
- `GET /api/questions/random` — Lower-level random endpoint (category UUID + filters).

---

## TypeScript types (client)

```ts
export type ExamCategoryCode =
  | 'cg'
  | 'sc'
  | 'co'
  | 'la'
  | 'di'
  | 'jof'
  | 'jo'
  | 'joa';

export interface PracticeQuestion {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
  passage?: string | null;
  passage_group?: string | null;
  language?: string | null;
}

export interface PassageBlock {
  title: string;
  content: string;
  reading_time_minutes: number;
  questions: PracticeQuestion[];
}

export interface RandomExamSession {
  category: ExamCategoryCode;
  category_name: string;
  is_universal: boolean;
  section_id: string | null;
  questions: PracticeQuestion[];
  french?: PassageBlock;
  english?: PassageBlock;
}

## Admin: Authoring Langues content

Use these admin endpoints to create `language_passages` and linked `language_questions` (preferred storage shape). These endpoints are protected — JWT + admin role required.

Endpoints

- `POST /api/admin/language/passages`
  - Body: `{ title?: string, content: string, reading_time_minutes?: number, language: 'french'|'english' }`
  - Response: created passage object

- `POST /api/admin/language/passages/:id/questions`
  - Create a single question linked to a passage.
  - Body: `{ text: string, options: string[], correct_answer: 'A'|'B'|'C'|'D'|'E', explanation?: string }`

- `POST /api/admin/language/passages/:id/questions/bulk`
  - Create multiple questions for the passage in one request. Body is an array of the same question objects.

Quick examples

Create a passage (French):

```http
POST /api/admin/language/passages
Authorization: Bearer <ADMIN_JWT>

{
  "title": "Passage Français",
  "content": "Mon frère porte un parapluie noir parce que le ciel est couvert...",
  "reading_time_minutes": 3,
  "language": "french"
}
```

Create questions for the passage:

```http
POST /api/admin/language/passages/<passage_id>/questions
Authorization: Bearer <ADMIN_JWT>

{
  "text": "Pourquoi porte-t-il un parapluie ?",
  "options": [
    "A. Parce qu'il fait nuit",
    "B. Parce que la pluie approche",
    "C. Parce qu'il fait du sport"
  ],
  "correct_answer": "B",
  "explanation": "Le texte lie le parapluie au ciel couvert."
}
```

Bulk create (legacy option — alternative):

If you prefer or already have CSV/legacy rows, reuse the existing admin `POST /api/questions/bulk` endpoint to insert groups of rows where each row contains the same `passage` and `passage_group` values. The backend will fall back to using `questions` with `passage_group` when `language_passages` are absent.

Notes for authors

- Preferred: use `language_passages` + `language_questions` for clean separation.
- Each passage should have 2–4 sentences and 2–5 questions (aim 3). Mix at least one inference question.
- `reading_time_minutes` defaults to `3` when omitted.

Testing

Use your admin token — quick curl to confirm both passage and questions exist:

```bash
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Passage Français","content":"Texte...","language":"french"}' \
  "http://localhost:3000/api/admin/language/passages" | jq
```

```
