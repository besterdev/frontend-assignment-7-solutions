# Verification

Verified locally on 12 November 2026 with Node.js 22.19.0.

- `npm test`: 12 tests passed across reducer, timer hook, aggregation, and HTTP route.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed; `/` statically rendered, `/api/departments` served dynamically.
- Chromium: clicked Apple into Fruit, waited 5.2 seconds, verified automatic return at the bottom; clicked Broccoli into Vegetable and back immediately, verified bottom placement; reset restored all items.
- Viewports: desktop and 390px mobile checked; no horizontal overflow on mobile.
- Live `/api/departments`: HTTP 200, 208 users grouped into 12 departments at verification time. Upstream data can change.
- Screenshots: `docs/screenshots/desktop.png` and `mobile.png`.

The dependency audit reported 8 moderate findings in development lint dependencies (typescript-eslint/minimatch chain). npm's suggested complete fix would downgrade eslint-config-next across major versions; no forced downgrade was applied. Real screen-reader and mobile-device testing were not performed.

## Drag and drop

Added dedicated grip handles using `@dnd-kit/core`. Valid destinations highlight during a drag. Category checks occur before dispatch, so a fruit cannot enter Vegetable. Dropping outside a target cancels the move. The original absolute-deadline scheduler is unchanged; dragging a sorted item does not pause or restart its timer.

Chromium verification passed for dragging Apple into the wrong column (rejected), dragging into Fruit, dragging back to the bottom of All items, dragging Broccoli into Vegetable and observing its automatic return after five seconds, and ordinary click-to-sort/return after drag interactions. Lint, TypeScript, build, and all 12 existing tests also passed after the change.
