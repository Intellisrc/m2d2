# Tutorial Playground — Manual Test Checklist

The playground's pure parse/assemble logic is unit-tested in `test/playground.test.ts`.
The interactive parts (CodeMirror, iframe srcdoc execution, postMessage) can only be
verified in a real browser. Run through this checklist after any playground change.

## Setup

1. `cd examples && ./serve.sh` (or `python3 -m http.server 8000`)
2. Open `http://localhost:8000/index.html`

## Shell (nav, routing, lesson text)

- [ ] Left nav lists all 6 lessons; clicking each loads it.
- [ ] Prev / Next buttons step through lessons in order.
- [ ] Browser back/forward changes the active lesson (hash routing).
- [ ] Title, description, and bullet points update for each lesson.
- [ ] Bullet-point `<code>` blocks are syntax-highlighted (atom-one-dark).

## Playground — editor

- [ ] Three tabs: HTML / JS / CSS. Switching preserves each pane's content.
- [ ] JS pane shows syntax-highlighted code (CodeMirror).
- [ ] Tab inserts 2 spaces; line numbers visible; bracket matching works.

## Playground — preview

- [ ] Preview iframe renders the lesson on load (white background, list visible).
- [ ] Edit the JS pane, click **Run ▶** → preview updates with the new code.
- [ ] Click **Reset ↺** → editor and preview return to the lesson's original code.
- [ ] Turn on **Auto-run**, edit → preview updates ~500ms after typing stops.
- [ ] Lesson dropdown jumps to any lesson.

## Playground — error bar

- [ ] Edit JS to introduce a `SyntaxError`, Run → red error bar appears under preview with the message.
- [ ] A `console.warn(...)` in lesson code → appears in the error bar (warn level).
- [ ] Clicking Run again with valid code → error bar clears.

## Lessons (each one renders and is interactive)

- [ ] **L1 Render the data**: user list + group list both render with seed data.
- [ ] **L2 Add a user**: form adds a row; empty name shows the warning.
- [ ] **L3 Edit and delete**: Edit swaps to inputs, Save writes back; Delete removes the row.
- [ ] **L4 Groups**: group add/delete works independently of users.
- [ ] **L5 Membership**: checkboxes reflect initial state; toggling logs the new groupIds.
- [ ] **L6 Persistence**: toggle membership → reload preview (Run) → checkbox state persists; Reset clears it.

## Responsive

- [ ] Narrow the browser to < 760px: editors stack above preview (single column).
