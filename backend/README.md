# QuietBridge backend

Demo-critical backend implementation for the requirements in `docs/REQUIREMENTS.md`.
It is deliberately isolated in `backend/` so a frontend branch can merge it without
changing the frontend package manifest.

## Run locally

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API starts on `http://localhost:3001`. Check it with:

```bash
curl http://localhost:3001/health
```

OpenAI extraction is optional. Without `OPENAI_API_KEY`, or with
`DEMO_OFFLINE=true`, deterministic extraction keeps every demo path functional.
To use OpenAI credits, add the key only to `backend/.env`:

```dotenv
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4.1-mini
```

Never commit `.env`.

## Frontend integration

Set the frontend API base URL:

```dotenv
VITE_API_URL=http://localhost:3001
```

Create one browser-session UUID and retain it in `localStorage`. Send it on every
request as `X-Session-Id`.

```ts
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export async function createSession(sessionId = crypto.randomUUID()) {
  localStorage.setItem("quietbridge_session_id", sessionId);
  const response = await fetch(`${API_URL}/v1/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      timezone: "Europe/London",
      locale: "en-GB",
    }),
  });
  return response.json();
}

export async function ingest(text: string, simNow?: string) {
  const sessionId = localStorage.getItem("quietbridge_session_id");
  const response = await fetch(`${API_URL}/v1/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": sessionId!,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      text,
      sim_now: simNow,
      client_local_time: new Date().toISOString(),
    }),
  });
  if (!response.ok) throw await response.json();
  return response.json();
}
```

The `/v1/ingest` response directly powers the three panels:

- `memory` → **What I Heard**
- `care_state` and `check_in_decision` → **What I Chose**
- `response`, `next_step`, `drafts`, `not_tonight` → **What I Did**
- `safety_verdict.action === "ESCALATE"` → replace normal content with the
  escalation card
- `care_state.safe_pivot === true` → show the inline non-advice notice and
  `PROFESSIONAL_QUESTION` draft

## Implemented endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Server and OpenAI/offline status |
| POST | `/v1/session` | Create or resume a browser session |
| GET | `/v1/session/:sessionId/state` | Rehydrate all current panel state |
| POST | `/v1/ingest` | Text turn: safety, signals, route, memory, triage, drafts |
| POST | `/v1/quiet` | Start a 12h, 24h, or until-return suppression window |
| DELETE | `/v1/quiet` | Explicitly exit quiet mode |
| GET | `/v1/check-in?sim_now=...` | Evaluate CHECK_IN versus STAY_QUIET |
| PATCH | `/v1/tasks/:taskId` | Promote, defer, complete, or mark not-mine |
| POST | `/v1/memory/do-not-ask` | Add a do-not-ask preference |
| PATCH | `/v1/memory/preferences` | Update mood and presentation preferences |
| GET | `/v1/events` | Read the backend decision timeline |
| POST | `/v1/demo/seed` | Seed one of five deterministic scenarios |
| POST | `/v1/demo/time-shift` | Move to Day 1, Day 4, or Day 14 |
| POST | `/v1/demo/compare` | Compare the same story at two times |
| POST | `/v1/session/:sessionId/reset` | Clear and retain the session ID |
| DELETE | `/v1/session/:sessionId` | Delete the session |

Demo endpoints accept `X-Demo-Key` only when `DEMO_KEY` is configured.

### Scenario names

- `MAYA_DAY1`
- `ADMIN_FATIGUE_DAY4`
- `ISOLATION_DAY14`
- `RISKY_LEGAL_PROMPT`
- `CRISIS_SIGNAL`

Example:

```ts
await fetch(`${API_URL}/v1/demo/seed`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Session-Id": sessionId,
  },
  body: JSON.stringify({ scenario: "MAYA_DAY1" }),
});

await fetch(`${API_URL}/v1/demo/time-shift`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Session-Id": sessionId,
  },
  body: JSON.stringify({ stop: "DAY_4" }),
});
```

## Verification

```bash
npm run build
npm test
```

The tests cover session creation, the Maya Day-1 route, exactly one next step,
idempotency, legal safe-pivot, crisis override, quiet mode, Day 4/14 Time-Shift,
and the same-story/different-time comparison.

## Deliberate hackathon limits

- Text input only; `VOICE_MODE=off`. Voice can be added without changing the
  response contract.
- State is in memory and resets when the server restarts.
- The deterministic crisis detector is a narrow demo safety net, not a clinical
  risk-assessment system.
- Session UUIDs are coordination IDs, not authentication. Do not treat this as a
  production privacy/security model.
- Real proactive delivery, Supabase persistence, STT/TTS, retention jobs, and
  production auth are not implemented.
