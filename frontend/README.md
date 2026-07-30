# QuietBridge frontend

React and TypeScript implementation of the QuietBridge three-panel experience.

## Run

Start the backend first:

```bash
cd backend
npm install
npm start
```

Then start the frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Backend configuration

```dotenv
VITE_API_URL=http://localhost:3001
```

The frontend creates a session UUID in `localStorage` and sends it as
`X-Session-Id`. The response maps directly onto the UI:

- `memory` → What I heard
- `care_state` and `check_in_decision` → What I chose
- `response`, `next_step`, `drafts`, `not_tonight` → What I did

## Included demo flows

- Text composer with one-decision copy.
- Declared mood presentation themes.
- Day 1, Day 4, and Day 14 Time-Shift controls.
- Same-story comparison at 14:00 and 03:00.
- Legal/financial safe-pivot.
- Crisis escalation takeover with UK contact routes.
- One-tap quiet mode.
- Canonical memory and do-not-ask controls.
- Single next step, draft copy, and deferred task queue.
- Responsive and reduced-motion layouts.

## Verification

```bash
npm run lint
npm run build
```
