# Feature Specification: Dashboard — "Continuer à s'entraîner" Section

---

## Overview

The dashboard contains a section titled **"Continuer à s'entraîner"** (Continue Training). This section displays one card for each of the four quiz item types: `cg`, `sc`, `co`, and `la`.

Each card represents a randomly selected item for that type. When the student taps a card, they are navigated to the **Item Course Screen**, with the selected item's ID passed as a navigation parameter.

---

## Data Fetching

To populate the four cards, make **4 simultaneous requests** (one per type) to the following endpoint:

**`GET /api/items/random`** — Returns a single random quiz item based on filters.

| Parameter    | Type   | Location | Description                                      |
|-------------|--------|----------|--------------------------------------------------|
| `type`      | string | query    | The item type to fetch. One of: `cg`, `sc`, `co`, `la` |
| `section_id`| string | query    | The ID of the student's section                  |

> Make all 4 requests in parallel (e.g., using `Promise.all`), each with a different `type` value and the same `section_id`.

### Response
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "type": "sc"
}
```

---

## Navigation Behavior

- Tapping a card navigates the student to the **Item Course Screen** (the existing `item-course` stack screen).
- Pass the item's `id` as a navigation parameter to that screen.
- The Item Course Screen must use the received `id` as the `item_id` filter when fetching its courses from `GET /api/item-courses`.

---

## Empty State

If no item is returned for a given type (e.g., the API returns no result or an error for that type), display an empty state message in place of that card:

> **"Il n'y a pas de items pour le moment"**

---

## UI & Styling

- The existing visual style of the section and its cards must remain **completely unchanged**.
- The only modifications are:
  1. Wiring the card's `onPress` to navigate to the Item Course Screen with the item ID.
  2. Rendering the empty state message when no item is available.