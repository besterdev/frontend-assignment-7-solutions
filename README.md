# Freshsort — Auto Delete Todo List

A small interactive board that sorts fruits and vegetables, then automatically returns each item to the main list after five seconds. Built for the 7Solutions assignment, including the optional department aggregation API.

## Getting started

**Requirements:** Node.js 22.12+ and npm. No environment variables, database, or API key are required. The department endpoint needs an internet connection to reach DummyJSON.

Run these commands from the project directory:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run a production build:

```bash
npm run build
npm start
```

## Todo board

- Click an item in **All items** to move it into its matching **Fruit** or **Vegetable** column.
- Each item returns to the **bottom** of All items five seconds after it is moved. Timers are independent.
- Click a sorted item to return it immediately.
- Drag the grip handle inside a card to move it into its matching column, or back into All items. Dropping into an incorrect category or outside the columns leaves the item unchanged.
- Press **Reset board** to restore the initial order and cancel pending returns.

The board uses the exact eleven supplied items and classifications, including Tomato as Vegetable. State is held in memory; refreshing restores the initial board. Dragging an item does not pause or restart its timer.

### Interaction and accessibility

The layout adapts to desktop and mobile screens. Regular buttons support Enter/Space, visible focus indicators, and a live board status. Drag handles support pointer input and keyboard controls: Space to pick up/drop, arrow keys to move, and Escape to cancel. Touch dragging uses a dedicated handle so the rest of the card remains available for scrolling and clicking.

Motion handles layout transitions and respects the reduced-motion preference. The shrinking progress bar runs without per-frame React state updates.

## Department API

```http
GET /api/departments
```

Try the [endpoint in your browser](http://localhost:3000/api/departments), use the **Department API** link in the header, or run:

```bash
curl --fail-with-body http://localhost:3000/api/departments
```

The endpoint fetches users from [DummyJSON](https://dummyjson.com/docs/users), validates the response, and groups users by `company.department`.

### Example response

The following is illustrative; live department names and counts depend on the upstream dataset.

```json
{
  "Engineering": {
    "male": 1,
    "female": 1,
    "ageRange": "22-30",
    "hair": {
      "Black": 1,
      "Blond": 1
    },
    "addressUser": {
      "AmyLee": "10100",
      "BobChen": "10200"
    }
  }
}
```

| Field            | Meaning                                                 |
| ---------------- | ------------------------------------------------------- |
| `male`, `female` | Number of users of each gender in the department        |
| `ageRange`       | Minimum and maximum ages, formatted as `min-max`        |
| `hair`           | User count for each hair color                          |
| `addressUser`    | `firstName + lastName` mapped to the user's postal code |

### Request handling and edge cases

- `limit=0` retrieves all users rather than only the default first page. `select` requests the fields needed for aggregation.
- Zod validates the required fields before aggregation.
- The upstream fetch uses a 300-second revalidation interval and a 10-second timeout.
- Upstream HTTP errors, invalid data, and network failures return **HTTP 502**:

  ```json
  {
    "error": "Unable to load department data. Please try again later."
  }
  ```

- Empty input produces `{}`. A department with one age produces a range such as `30-30`.
- If multiple users in one department share the same concatenated name, the last postal code wins. This follows the requested object shape, which cannot represent duplicate keys.
- Null-prototype records safely accommodate keys such as `__proto__` and `constructor`.

This implementation uses **HTTP/JSON through a Next.js Route Handler**. gRPC is not implemented. The handler is named `getDepartmentSummary` and exported as `GET`, preserving a descriptive function name while following Next.js routing conventions.

## Implementation choices

### Deterministic state transitions

A pure reducer owns the ordered list of available IDs and the active placements. Names, categories, and emoji live in a separate item catalog. The UI and drag handlers dispatch the same sort/return actions, keeping behavior consistent across input methods.

### One scheduler, independent deadlines

Each placement stores an absolute `expiresAt` timestamp. A single timeout wakes at the nearest deadline and returns all overdue items in deadline order.

Adding another item reschedules the next wake-up without extending existing deadlines. Returning an item removes its placement, so an old deadline cannot expire a later placement of the same item. The effect cleans up timers and visibility listeners on reset, dependency changes, and unmount.

Browser timers can be delayed in suspended or background tabs. The visibility listener reconciles overdue placements when the tab becomes visible again; an exact five-second callback cannot be guaranteed while browser execution is suspended.

### Performance and tradeoffs

- Department aggregation traverses users once: **O(n)** time and **O(n)** worst-case output space.
- Upstream field selection and fetch caching reduce repeated data transfer.
- The fixed eleven-item board uses straightforward array operations and local React state.
- `@dnd-kit/core` provides drag sensors and an overlay. An 8px activation threshold separates dragging from ordinary pointer clicks.

A timeout per item would also work for this board, but needs a timer registry and cancellation for manual returns and re-entry. The nearest-deadline approach keeps one active timeout and makes expiration easy to test. Polling would introduce unnecessary periodic wake-ups.

## Tech stack

| Area                  | Tools                                                         |
| --------------------- | ------------------------------------------------------------- |
| App and HTTP endpoint | Next.js App Router, React, TypeScript with ES modules         |
| Styling               | Tailwind CSS, source-owned shadcn/ui-style Button, Radix Slot |
| Animation             | Motion                                                        |
| Drag and drop         | `@dnd-kit/core`                                               |
| Data validation       | Zod                                                           |
| Testing               | Vitest, React Testing Library, jsdom                          |

## Project structure

```text
src/
├── app/
│   ├── api/departments/route.ts  # HTTP handler and upstream fetch
│   ├── globals.css              # Theme, layout, responsive styles
│   ├── layout.tsx               # Root layout and metadata
│   └── page.tsx                 # Board entry point
├── components/
│   ├── todo-board.tsx           # Board, draggable items, drop targets
│   └── ui/button.tsx            # Shared Button primitive
├── hooks/use-todo-board.ts      # Reducer integration and timer lifecycle
└── lib/
    ├── departments.ts          # API schema, types, aggregation
    ├── todo.ts                 # Initial items and state transitions
    └── utils.ts                # Class name merging

tests/
├── todo.test.ts                # Ordering, expiration, re-entry, reset
├── timer.test.tsx              # Independent deadlines and timer cleanup
└── departments.test.ts        # Aggregation and mocked HTTP responses
```

## Validation

```bash
npm test                # Run the test suite
npm run test:watch      # Run tests in watch mode
npm run lint            # ESLint
npm run typecheck       # TypeScript without emitting files
npm run build           # Production compilation and route checks
```

The latest local checks passed all **12 tests**, lint, TypeScript, and the production build. Browser checks covered automatic/manual returns, valid and invalid drag destinations, drag-to-return, and handle placement at desktop and mobile widths. HTTP route tests mock the upstream API, so the suite does not require a live DummyJSON connection.

See [verification notes](docs/verification.md) for the recorded checks and remaining testing limits.
