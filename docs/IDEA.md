# Product Brief: QuietBridge (Hackathon Track 1 Submission)

## Hackathon Judging Criteria
The same four criteria apply to both tracks, and each is weighted equally:

* **Originality:** How fresh or unexpected the idea and approach are.
* **Technical Execution:** How far the team gets and how well the product actually works.
* **Applicability:** Whether it would genuinely help someone or matter specifically to EverSettled.
* **Fit to the Brief:** Judged live from what is shown in the demo; no test cases are required.

## Track 1 Alignment & Build Constraints
QuietBridge is a **Track 1 - Presence** entry. The brief asks for an agent that supports someone through a hard period, not merely one that answers a single prompt. It explicitly welcomes both a care copilot and the infrastructure that remembers context and decides when to check in or leave someone alone; QuietBridge combines both directions.

### What the live demo must prove
* The agent understands the person and their changing situation, not just the latest prompt.
* Presence is demonstrated across time: what it remembers, what it deliberately defers, and why it checks in or stays quiet.
* The care-state routing and one-next-step output work reliably with clear, visible reasoning.
* The estate-settlement context matters to EverSettled: families can face up to 18 months, substantial costs, and hundreds of hours of administrative work while grieving.

### Care, data, and implementation principles
* Do not position QuietBridge as a therapist, doctor, solicitor, or financial adviser. Recognise genuine crisis, signpost appropriate help, and hand off to people or services when that is the kind response.
* Use synthetic/demo data only; do not enter real personal or sensitive information into the prototype.
* Keep provider credentials and event codes out of source control.
* Use a cost-aware model strategy: develop and route routine requests with a fast, low-cost model; reserve higher-reasoning or live-voice models for the moments that demonstrably need them.
* Voice is optional but valuable where tone carries empathy. Any spoken response should preserve QuietBridge's restraint, pacing, and silence-first design.

## 1. Executive Summary & Vision
QuietBridge is an empathetic care-routing agent designed for individuals undergoing acute cognitive overload and grief (e.g., bereavement, diagnosis, major loss). Rather than acting as a standard conversational chatbot that responds with long paragraphs, QuietBridge acts as a front-door buffer. 

It ingests user voice notes or text, assesses emotional state and cognitive load, and executes mode-routing to decide whether to LISTEN, STAY QUIET, ORGANISE, SOFTEN, or ESCALATE. It converts overwhelming administrative demands into exactly ONE manageable next step, queues non-urgent tasks for later, and manages presence and check-ins over a multi-day/multi-week timeline ("the stretch").

## 2. Core Problem & Track Alignment
* **Track:** Track 1 (Presence / Emotional Copilot & Infrastructure over time).
* **The Problem:** People in crisis suffer from severe administrative burden paired with extreme mental fatigue. Standard AI companions talk too much and increase cognitive load; traditional software demands immediate task completion.
* **The Solution:** An agent that prioritises restraint, silence, and burden triage over conversation, tracking progress and deciding when to check in versus when to leave the user alone over a 14-day stretch.

## 3. Product Features & Core Capabilities

### A. Dynamic Care-State Router
The system must parse all user inputs through a deterministic classification engine returning a structured JSON state:
* **Modes:**
  * `WITNESS`: Low-pressure acknowledgment, zero follow-up questions.
  * `ORGANISE`: High admin burden; extracts 1 immediate action, drafts outputs, queues the rest.
  * `QUIET`: Minimal UI, minimal voice output, silence mode activated.
  * `SOFTEN`: Emotional holding without action items or advice.
  * `ESCALATE`: Safe crisis intervention mode.
* **Contextual Variables Evaluated:** Time of day, detected fatigue/grief level, administrative density, legal risk level, user energy score.

### B. "The Stretch" Engine (Multi-Day Presence & Check-in Logic)
To demonstrate presence over time, the system includes a time-progression model:
* **Day 1 (Acute Overload - e.g., 3 AM):** Mode: `QUIET + ORGANISE`. Drops all non-essential demands. Generates 1 work message draft. Suppresses all proactive check-ins for 12 hours.
* **Day 4 (Admin Fatigue - e.g., 11 AM):** Mode: `ORGANISE`. Gently surfaces 1 task from the "Not Tonight" queue (e.g., UK Tell Us Once / Death Notification Service prep).
* **Day 14 (Isolation Phase - e.g., 8 PM):** Mode: `WITNESS / SOFTEN`. Admin cleared. Initiates a zero-pressure check-in offering low-friction company or continued silence.

### C. Burden Triage & Action Generation
* **Single Next Step:** Isolates the single highest-priority item.
* **"Not Tonight" Queue:** Automatically parks peripheral tasks into a hidden, non-threatening secondary list.
* **Smart Drafts:** Auto-generates lightweight drafts (e.g., notification to employer, bank call script, government reporting pre-fills).

### D. Safety & Domain Guardrails
* **Legal/Financial Disclaimer:** If the user asks high-risk domain questions (e.g., "Can I empty her bank account now?"), the system pivots into safe mode: neutral acknowledgment, explicit disclaimers on legal advice, and a drafted inquiry to send to a professional.
* **Crisis Escalation:** Keywords indicating self-harm or severe crisis trigger immediate local emergency routes (e.g., NHS 111, Samaritans 116 123, 999).

### E. Optional Module: Live Voice Companion (BimpeAI)
**Status: OPTIONAL. Cut-safe.** Ships behind a flag. No other feature depends on it, and removing it changes nothing else in the product or the pitch.

**Why it is worth the demo slot.** A judge or teammate speaks a tired voice note into the page, the same care-state router runs, and the reply comes back spoken at crisis pacing. Presence becomes audible rather than described. It also sharpens `QUIET`: an agent that *can* speak and chooses not to reads as restraint, whereas a silent text box reads as an empty text box.

**Scope if built (deliberately small):**
* One BimpeAI agent bound to one workflow, system prompt carrying the QuietBridge router persona and the existing care-state JSON contract.
* Web Voice widget mounted on the demo page: browser mic in, spoken reply out.
* Each turn's transcript written back into the *What I Heard* panel so voice and the 3-panel UI stay in sync.
* `QUIET` mode caps or suppresses spoken output entirely. Silence is the feature; demonstrate it on stage.

**Integration contract** (from https://docs.bimpe.ai/docs/api/ and a prior working build):
* **Server SDK:** `npm i @bimpeai/sdk` or `pip install bimpeai`. Client: `new BimpeAI({ apiKey })`.
* **Auth:** team key with `sk_` prefix, sent as `Authorization: Bearer sk_...` or `X-Api-Key: sk_...`. Keys are scope-restricted; a wrong scope returns `403 insufficient_scope`. Server-side only — never in the browser bundle, never committed.
* **Provisioning:** `workflows.list()` to get a workflow id, then `agents.create({ name, description, workflow_id })`. The router persona is patched onto the workflow's system prompt.
* **Text path (same agent, no audio):** `conversations.list(agentId)` and `conversations.messages.send(agentId, conversationId, { message })`. This doubles as the fallback path, so the agent still works with voice switched off.
* **Browser voice:** script tag `https://agent.bimpe.ai/voice-widget.js` plus `window.BimpeAIVoiceWidgetConfig = { clientId, position, primaryColor, maxDurationSeconds }`. The `clientId` is issued by Deploy → Web Voice channel activation in the console and is a scoped public identifier, not the team key. The widget uses `getUserMedia` and a WebSocket stream for real-time audio.
* **Zero-wiring fallback:** iframe the hosted agent page at `agent.bimpe.ai/{test_code}` — no `clientId` plumbing, but little control over styling.
* **Also available if the demo wants a phone moment:** the API exposes Calls (outbound test calls, call logs, transcripts) and Phone numbers.

**Check these before spending build time:**
* Web Voice and Web Chat widgets were gated behind a paid plan tier in the console as of the July 2026 build. Confirm the account tier in the first hour, not the last.
* There is no official npm widget package. Embedding means a script tag or an iframe.
* Live voice needs mic permission and a quiet room. Venue noise is a real failure mode.
* Pick **one** voice provider for the live demo. ElevenLabs (section 4) and BimpeAI both cover the spoken layer; wiring both splits the time budget and buys nothing on stage. ElevenLabs is the sponsor-aligned default; BimpeAI is the faster route to a full agent because provisioning, transport, and turn-taking arrive as one platform.

**Degradation ladder (decide at the checkpoint, not at the podium):**
1. Live BimpeAI voice turn on stage.
2. Mic, network, or plan tier fails → play a pre-recorded 20-second clip of the same exchange, then continue in the UI.
3. Not working end to end by the freeze checkpoint → ship text input only. Pull the voice line from the script, the voice slide from the deck, and leave the flag `off`. The care-state router, the Stretch engine, and the 3-panel UI carry the demo unchanged.

**Flag:** `VOICE_MODE = off | elevenlabs | bimpe`, defaulting to `off`. Every voice call site checks it, so the module can be dropped by config rather than by editing code under time pressure.

## 4. Technical Architecture & Integrations
* **Frontend/Backend Stack:** Built on Lovable for full-stack rapid web app deployment with reactive state management.
* **Voice Pipeline (optional layer, `VOICE_MODE` flag):** Default target is the ElevenLabs Expressive Conversational API (v3) with dynamic speed/pacing control (0.8x-0.9x for crisis) and intelligent turn-taking. BimpeAI (section 3E) is the alternative provider and gives a hosted voice agent with less wiring. Whichever is chosen, the text path stays authoritative: the care-state router, memory, and action generation never call the voice provider, so `VOICE_MODE=off` degrades to a fully working product rather than a broken one.
* **Domain Context:** Tailored to estate/loss administration (EverSettled domain alignment) without duplicating formal probate workflows.
* **State Visualization UI:** A 3-panel interface showing:
  1. *What I Heard* (Canonical memory & fatigue detection)
  2. *What I Chose* (Visible Care State & decision rationale)
  3. *What I Did* (The single action card + quiet buffer button)
* **Demo Control Panel:** Includes a "Time Shift" simulator slider (Day 1 -> Day 4 -> Day 14) to demonstrate multi-day check-in logic during presentation.

## 5. Agent Instructions
Please act as a Principal AI Systems Architect. Take this product brief and generate a comprehensive Software Requirements Specification (SRS) / Technical PRD, including:
1. Detailed Functional & Non-Functional Requirements.
2. Complete Data Models & JSON Schema contracts for the Care-State Router.
3. System Architecture Diagram (text/Mermaid format) covering Voice Ingestion -> LLM Routing -> State DB -> Voice Output, with the voice edges drawn as an optional branch behind `VOICE_MODE`.
4. Step-by-Step API Specification for all endpoints.
5. Frontend UI/UX Component Tree & Layout Specifications for Lovable development.

Treat the voice layer (section 3E) as a separate optional module throughout: every voice requirement carries an explicit OPTIONAL marker, every voice endpoint and component has a no-voice equivalent, and the SRS states plainly what the product still does when `VOICE_MODE=off`. Do not let a voice dependency appear on the critical path of any core requirement.
