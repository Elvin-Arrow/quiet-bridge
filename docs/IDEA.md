# Product Brief: QuietBridge (Hackathon Track 1 Submission)

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

## 4. Technical Architecture & Integrations
* **Frontend/Backend Stack:** Built on Lovable for full-stack rapid web app deployment with reactive state management.
* **Voice Pipeline:** ElevenLabs Expressive Conversational API (v3) with dynamic speed/pacing control (0.8x-0.9x for crisis) and intelligent turn-taking.
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
3. System Architecture Diagram (text/Mermaid format) covering Voice Ingestion -> LLM Routing -> State DB -> ElevenLabs Output.
4. Step-by-Step API Specification for all endpoints.
5. Frontend UI/UX Component Tree & Layout Specifications for Lovable development.