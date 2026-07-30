# QuietBridge

Hackathon submission, Track 1: Presence. Host: EverSettled. Sponsors: ElevenLabs, Lovable.

QuietBridge turns one overwhelmed voice note into the right kind of help, not necessarily a reply. Sometimes that means a gentle sentence. Sometimes it means one draft email, one practical step, and silence until tomorrow.

**Thesis:** empathy is not primarily what you say. It is how you decide what kind of help to give, and how much. Silence, burden triage, and escalation are first-class actions here, not response styling.

**Engineering claim:** the LLM perceives; deterministic code decides. Mode selection, priority scoring, the crisis first pass, and the check-in-versus-stay-quiet call are all plain JavaScript, not prompts.

## The problem

People in acute grief carry a heavy administrative load on top of extreme mental fatigue: banks, probate, insurers, the taxman, all wanting a response while they can barely form a sentence. Chatbots that talk at length add cognitive load. Software that demands an answer right now makes it worse. QuietBridge's job is to decide, message by message, whether tonight is a night this person should be doing anything at all.

## How it decides

Every message runs through a deterministic router (`src/signals.js`) before anything touches an LLM.

1. **Crisis check first.** A 25-term recall-biased lexicon (`kill myself`, `overdose`, `no reason to live`, and similar phrasing) is checked against the raw text. A hit short-circuits everything else and returns a fixed safety response. No network call involved.
2. **Signal extraction.** Admin density, fatigue, anxiety, and sentence fragmentation are scored from term counts and message shape. Time of day, read from the demo clock, buckets into NIGHT / MORNING / AFTERNOON / EVENING, and NIGHT alone can flip the mode for identical text.
3. **Mode decision.** `decideModes()` picks from five modes: WITNESS, ORGANISE, QUIET, SOFTEN, ESCALATE. It's a pure function: same signals in, same modes out, no model involved.
4. **Perception, not authorship.** Only after the mode is fixed does an OpenAI call (`gpt-4o-mini`) run, twice: once to extract facts, tasks, and who died from the message, once to draft a reply inside that mode's constraints (word cap, banned phrases, no questions). The model never chooses the mode and never gets the final word on length; `capWords()` trims the reply after generation, in code.
5. **Fail closed.** If the model call fails or returns unparseable JSON (one repair retry, then give up), the router falls back to a small set of hand-written, mode-appropriate sentences and marks the turn `degraded: true`. The UI says so ("I routed this on time and workload only"). It never falls through to an unguarded LLM response.

Word caps are enforced in code, not just requested in the prompt: QUIET 25 words, WITNESS 35, SOFTEN 45, ORGANISE and ESCALATE 60. Playback speed follows the mode too: ESCALATE 0.80x, QUIET 0.85x, SOFTEN 0.90x, everything else 1.0x.

## What's built vs. what's specced

`docs/REQUIREMENTS.md` describes a larger system than fits in a hackathon build window. Here is what actually runs against what's still on paper.

| Area | Built | Specced, not built |
|---|---|---|
| Care-state router | Deterministic 5-mode decision, word caps enforced post-generation, local crisis classifier (25 terms, zero network) | Domain-risk classifier for legal/financial questions, a "safe pivot" mode, certainty audit |
| Presence over time | Time-Shift simulator (Day 1 / Day 4 / Day 14), a 12-hour quiet window, "I can stay quiet now" button | The Stretch engine's `CheckInDecision` logic and suppression windows; actual check-in delivery |
| Memory | A 6-item in-memory fact list, deduplicated per session | Memory-kernel versioning, a do-not-ask list, persistence (Postgres/Supabase); everything wipes on restart |
| Task handling | Single next-step extraction, mode-gated ORGANISE output | "Not Tonight" queue contents, smart drafts (work email, bank call script, Tell Us Once prep) |
| Voice | ElevenLabs TTS output with SHA1 response caching, mode-to-speed matrix, silent degradation if the API fails. Voice input via OpenAI `whisper-1` (`POST /v1/listen`): raw audio buffer in, domain-biased decode prompt so "probate", "registrar", and "Tell Us Once" survive a shaky 3AM recording, honest degradation (`503 LISTEN_OFF`, `400 NO_AUDIO`, `422 NO_SPEECH`, `500 LISTEN_FAILED`, all shown to the user as "I did not catch that.") | None |
| UI | Entry screen (channel + 4 mood chips + skip), 3 panels (What I Heard / What I Chose / What I Did), `data-mood` theming across all 6 tokens, `prefers-reduced-motion` support | Same-story / different-hour compare toggle |
| Demo tooling | Time-Shift with 3 fixed stops, permanently labelled "Simulator — moves the clock, not real time" | `/control` panel, scenario seeds, a degrade switch, telemetry, `DEMO_OFFLINE` stub |
| Safety | Deterministic crisis classifier, three UK routes as tappable links | Judge-attack button |

## Presence, honestly

The distinction that matters here: the *decision* to check in or stay quiet is real, recorded, and inspectable in every care-state response. The *delivery* of a proactive check-in, the system reaching out unprompted, is not built. This is a request-response demo, not a background service. `check_in_decisions` is already shaped as a drainable outbox with `due_at` and `delivery_state` fields, which is the one seam that would let delivery become real later without touching the router, memory, or Stretch logic.

## Safety

The crisis classifier runs first, locally, with zero network calls, before a message ever reaches an LLM. It's deliberately recall-biased: a false positive costs one extra escalation card, a false negative could cost a life. It keeps working with all outbound network access blocked.

An escalation shows three UK routes as tappable links: **999 or A&E**, **NHS 111**, **Samaritans on 116 123**. The escalation copy stays under 45 words, doesn't moralise, and never says "I'm just an AI." Every guardrail failure degrades to a plain acknowledgement, never to an unguarded model response.

QuietBridge never claims to be a therapist, doctor, solicitor, or financial adviser. It never uses clinical language about the person it's talking to, never role-plays or channels the person who died, and never reaches for euphemism: the word used is "died," never "journey," "healing," "closure," or "loved one." No emoji, no exclamation marks. All demo data is synthetic; no real personal data goes near the prototype.

**Deliberately not built: facial-emotion capture.** It came up early as an obvious feature to reach for, and got rejected on four grounds. First, the underlying inference is not sound: Barrett, Adolphs, Marsella, Martinez, and Pollak's 2019 review in *Psychological Science in the Public Interest* found that facial movements don't reliably map to specific emotions across people and contexts, a grieving person's flat face and a bored person's flat face look the same. Second, it would be biometric-class data under UK GDPR and sit squarely in territory the EU AI Act is aimed at (article numbers not independently verified here, so treat that as directional, not settled law). Third, it fights the product's own thesis: a camera-permission prompt before the first sentence is the loudest demand you can make in a product built to make fewer demands. Fourth, it's the most fragile thing you could put on a stage with venue wifi and unpredictable lighting. This is "not built," not "the system reads your face." It's where this could go next, not a claim about what it does now.

## Positioning vs. EverSettled's Sage

EverSettled already ships a chatbot, Sage, for estate settlement. QuietBridge isn't trying to out-chat it. It's the front door: the layer that decides whether tonight is a night this person should be handed off to a workflow at all, or whether the right response is one sentence and then nothing until tomorrow.

## Architecture

Vanilla HTML/CSS/JS frontend, Node + Express backend, one in-memory session. Nothing persisted, everything synthetic. About 940 lines of code total.

```
server.js          8 endpoints, in-memory session state              157 lines
src/router.js      two OpenAI calls, JSON repair retry,               167 lines
                    honest-degradation fallback
src/signals.js      fully deterministic, zero network                 163 lines
src/voice.js        ElevenLabs TTS with SHA1 response cache            49 lines
public/index.html   entry screen + 3-panel layout                      92 lines
public/styles.css   mood theming, reduced-motion support              151 lines
public/app.js       composer, panels, quiet button, time-shift        160 lines
```

**Endpoints:** `GET /v1/state`, `POST /v1/mood`, `POST /v1/ingest`, `POST /v1/quiet`, `DELETE /v1/quiet`, `POST /v1/speech`, `POST /v1/demo/time-shift`, `POST /v1/session/reset`.

**Stack:** Node.js (>= 20.6), Express 4, vanilla JS/HTML/CSS, OpenAI `gpt-4o-mini`, OpenAI `whisper-1`, ElevenLabs TTS (`eleven_multilingual_v2`).

## Running it

```bash
npm install
cp .env.example .env   # then fill in your own keys, see below
npm start               # or: npm run dev   (auto-restarts on file changes)
```

Open `http://localhost:3000`.

### Environment variables (`.env`)

| Variable | Required | Notes |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Powers perception and response generation |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `VOICE_MODE` | No | `off` or `elevenlabs`. Defaults to `off`; the app is a complete product either way |
| `ELEVENLABS_API_KEY` | Only if `VOICE_MODE=elevenlabs` | |
| `ELEVENLABS_VOICE_ID` | Only if `VOICE_MODE=elevenlabs` | |
| `PORT` | No | Defaults to `3000` |

Never commit `.env`. `.env.example` holds the template, and `.gitignore` already excludes real env files.

`npm run check` is defined in `package.json`, but `scripts/check-keys.js` doesn't exist yet, so that script currently fails. Use `npm start` or `npm run dev` instead.

## What to try in the demo

1. Load the app, pick "Type," pick a mood (or skip).
2. Send a message at the default Day 1 / 03:00 clock that names several admin tasks. Watch it route to QUIET or ORGANISE and cap itself to one next step.
3. Tap **Time Shift** to Day 4 or Day 14 and resend similar text. The mode and pacing change with the clock, not just the words.
4. Tap "I can stay quiet now." The screen reduces to "I'll be here. Nothing until tomorrow."
5. Send a message containing crisis language. It escalates instantly, with no network round trip, and shows the three UK routes.

## Repository status

`server.js`, `src/`, `public/`, and `package.json` are currently untracked in git. They need to be committed and pushed before the repo link in the submission is useful to anyone opening it fresh.

## More

Submission copy, elevator pitch, and the one-pager live in [`docs/pitch/SUBMISSION.md`](docs/pitch/SUBMISSION.md).
