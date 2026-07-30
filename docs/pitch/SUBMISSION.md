# QuietBridge: submission package

> **[FILL IN before submitting]**
> - Event name:
> - Submission deadline (date + timezone):
> - Submission platform (Devpost / other):
> - Team name(s) and roles:
> - Public repo URL:
> - Live demo URL (if hosted) or "local only":

Everything below is written to be pasted directly into a submission form. Adjust only the bracketed fields above; the rest is accurate to the current build.

---

## 30-second elevator blurb

QuietBridge is a care-routing layer for someone in acute grief, built for EverSettled's estate-settlement platform. It reads one voice note or text message and, instead of replying with a paragraph, decides what kind of help actually fits: stay quiet, name one task and let the rest wait, just acknowledge what was said, or escalate to a real crisis line. That decision is deterministic code, not a prompt guess, and the crisis check runs the same way whether or not the network is up. Sometimes the right answer is silence until tomorrow.

*(~90 words, about 30 seconds read aloud)*

---

## Short description (≤50 words)

QuietBridge decides what kind of help a grieving person needs before it decides what to say: stay silent, name one task, just listen, or escalate to a crisis line. A deterministic router picks the mode; an LLM only drafts words inside limits the code enforces afterward.

*(46 words)*

---

## Long description (≤250 words)

People newly bereaved carry two loads at once: heavy administrative burden (banks, probate, insurers, the taxman) and extreme mental fatigue that makes normal software, and normal chatbots, worse rather than better. QuietBridge is a care-routing layer that decides what kind of help fits a given moment, not just what to say.

Every message runs through a deterministic router before any model call. A 25-term crisis lexicon checks first and needs no network access; a hit short-circuits straight to a fixed safety response with UK crisis-line links. If there's no crisis, the router scores admin density, fatigue, anxiety, and message shape, and picks from five modes: WITNESS, ORGANISE, QUIET, SOFTEN, ESCALATE. Only after the mode is fixed does OpenAI's `gpt-4o-mini` get involved: once to read out facts and tasks, once to draft a reply inside that mode's word cap and banned-phrase list, both enforced in code, not just requested in the prompt. If the model call fails, a hand-written fallback covers it and the UI says so.

The interface shows the reasoning across three panels (what it heard, what it chose, what it did), plus a Time Shift simulator that jumps the demo clock across a 14-day grief timeline, and a one-tap "stay quiet" button with no confirmation dialog.

QuietBridge sits in front of EverSettled's own assistant, Sage, as the layer that decides whether tonight is a night this person should be in a workflow at all, not as a competing chatbot.

*(241 words)*

---

## Built with

Node.js, Express, vanilla JS/HTML/CSS, OpenAI `gpt-4o-mini`, ElevenLabs TTS.

This is the complete list. Nothing else shipped in the running code, regardless of what earlier planning docs mention.

---

## What we learned

Enforcing behavior in code beats trusting a prompt. Word caps and mode selection stayed reliable through hours of rehearsal only because they live in `signals.js`, not in a system message a model could drift away from under time pressure. The harder lesson was how much a demo's honesty has to be built in from the start: knowing exactly which pieces are real (the router, the crisis path) and which are simulated (proactive check-ins, the Stretch engine) mattered as much as any single feature, because a judge will ask, and a hand-wave answer costs more than the missing feature itself.

## What's next

The most direct next step is turning the outbox already shaped for it, `check_in_decisions` with `due_at` and `delivery_state` fields, into an actual scheduled delivery mechanism, so a stay-quiet decision made tonight can produce a real message tomorrow instead of just a database row. After that: voice input, so the Talk chip does something; persistence, so a session survives a restart; and the domain-risk classifier for the legal and financial questions the router currently has no special handling for.

---

## One-pager

*(Single screen. Print or read in about 60 seconds.)*

### QuietBridge

**The problem.** Acute grief comes with a heavy administrative load and no capacity to handle it. Chatbots that talk at length add cognitive load. Software that demands an answer right now makes it worse.

**The idea.** Empathy isn't primarily what you say. It's how you decide what kind of help to give, and how much. QuietBridge treats silence, burden triage, and escalation as first-class decisions, not response styling.

**How it works.** A deterministic router (`src/signals.js`) reads each message and picks one of five modes before any model runs: WITNESS, ORGANISE, QUIET, SOFTEN, ESCALATE. A 25-term crisis check runs first, locally, with no network call. Only after the mode is set does an LLM (`gpt-4o-mini`) draft a reply, constrained to a word cap the code enforces afterward, not just requested in the prompt. If the model fails, a hand-written fallback takes over and says so.

**What's real vs. simulated.** The mode decision, the crisis path, the word caps, and the time-of-day logic are real and run live. Proactive check-in delivery (the system reaching out unprompted, days later) is simulated for the demo; the data model already has the outbox shape (`check_in_decisions`, `due_at`, `delivery_state`) to make it real without a router rewrite.

**Safety.** Crisis detection runs before anything else touches the network. Any escalation shows three UK routes: 999/A&E, NHS 111, Samaritans on 116 123. QuietBridge never role-plays the person who died, never uses euphemism, and fails closed on every guardrail error.

**Positioning.** EverSettled's Sage is the chatbot. QuietBridge is the front door: it decides whether tonight is a night this person should be in a workflow at all.

**Stack.** Node.js, Express, vanilla JS/HTML/CSS, OpenAI `gpt-4o-mini`, ElevenLabs TTS. About 940 lines of code.

**Team.** [FILL IN]

---

## Deadline checklist

- [ ] **Commit and push the code.** `server.js`, `src/`, `public/`, and `package.json` are currently untracked in git. Nothing above is verifiable from the repo link until this happens.
- [ ] Confirm the exact deadline and timezone; set an alarm for one hour before.
- [ ] Fill in every `[FILL IN]` block in this document (event name, deadline, platform, team, repo URL, demo URL).
- [ ] Submit a draft the moment a title, one-liner, and repo link exist, even if unfinished. A rough draft on time beats a finished project after the cutoff.
- [ ] Record or confirm a demo video; check it plays for a logged-out viewer.
- [ ] Confirm the repo link works logged-out and the README renders as expected on GitHub.
- [ ] Confirm the live demo URL works logged-out, if one exists (this build currently runs locally only, see README).
- [ ] Double-check team members, track ("Track 1: Presence"), and category are set correctly on the submission form.
- [ ] Attach the deck (PDF + PPTX) if the platform requires it.
- [ ] Do a final read of the short and long descriptions above for typos before pasting them in.
- [ ] Click final submit and confirm you see the "submitted" state. Don't assume a saved draft counts.
