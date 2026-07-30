---
marp: true
theme: default
paginate: true
size: 16:9
backgroundColor: #0b0f0e
color: #eef2f0
style: |
  section {
    font-family: 'Avenir Next', 'Helvetica Neue', sans-serif;
    padding: 60px 76px;
  }
  h1, h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  h1 { font-size: 3.2em; color: #eef2f0; margin-bottom: 0.15em; }
  h2 { font-size: 1.9em; color: #eef2f0; margin-bottom: 0.3em; }
  h3 { font-size: 1.2em; color: #7fb8a4; font-weight: 500; }
  p { font-size: 0.9em; line-height: 1.5; }
  .eyebrow {
    display: inline-block;
    font-size: 0.6em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #7fb8a4;
    border: 1px solid rgba(127,184,164,0.4);
    border-radius: 999px;
    padding: 6px 16px;
    margin-bottom: 18px;
  }
  .tag-notbuilt {
    display: inline-block;
    background: rgba(224,119,109,0.15);
    color: #e0776d;
    border: 1px solid rgba(224,119,109,0.45);
    border-radius: 999px;
    padding: 5px 16px;
    font-size: 0.55em;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }
  .metric { font-size: 4.2em; font-weight: 800; color: #7fb8a4; line-height: 1.05; }
  .subtle { color: #9aa39e; font-size: 0.68em; }
  .quote-big {
    font-size: 1.5em;
    line-height: 1.45;
    color: #eef2f0;
    font-family: Georgia, serif;
    font-style: italic;
    max-width: 92%;
  }
  .cards { display: grid; gap: 16px; margin-top: 22px; }
  .cards-5 { grid-template-columns: repeat(5, 1fr); }
  .cards-4 { grid-template-columns: repeat(2, 1fr); }
  .cards-3 { grid-template-columns: repeat(3, 1fr); }
  .cards-2 { grid-template-columns: repeat(2, 1fr); }
  .card {
    background: rgba(255,255,255,0.045);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 16px;
    padding: 16px 16px;
  }
  .card h4 {
    color: #7fb8a4;
    font-size: 0.85em;
    margin: 0 0 8px 0;
    letter-spacing: 0.02em;
    font-family: Georgia, serif;
  }
  .card p { font-size: 0.62em; color: #cfd6d2; margin: 0; line-height: 1.42; }
  .accent { color: #7fb8a4; }
  .warn { color: #e0776d; }
  code {
    background: rgba(255,255,255,0.08);
    padding: 1px 6px;
    border-radius: 6px;
    font-size: 0.85em;
  }
---

<!-- _paginate: false -->
<span class="eyebrow">Track 1 · Presence</span>

# QuietBridge

### "It turns one overwhelmed voice note into the right kind of help — not necessarily a reply."

<p class="subtle">Host: EverSettled · Sponsors: ElevenLabs · Lovable</p>

<!--
Open cold. No logo parade. Say the one-liner slowly, let it land, then pause before advancing.
-->

---

## 3:07 AM, and Maya can't sleep

<div class="cards cards-2">
<div class="card"><h4>The moment</h4><p>Her mother died last night. Work is messaging. The bank wants documents. She hasn't slept.</p></div>
<div class="card"><h4>The interface</h4><p>One phone, one dark room, one thumb. Ask her more than one thing and she leaves.</p></div>
</div>

<p class="quote-big" style="margin-top:26px;">"She wants the world reduced, not explained."</p>

<!--
Maya, 38, is the demo persona. Ground the room in her before any architecture talk.
-->

---

## Cognitive overload, not information scarcity

<div class="cards cards-2" style="margin-top:36px;">
<div class="card"><h4>People in crisis carry</h4><p>Severe administrative burden, plus extreme mental fatigue, all at once.</p></div>
<div class="card"><h4>What fails them</h4><p>Companions that talk too much and add to the load. Software that demands everything now.</p></div>
</div>

<!--
Why every other AI companion misses this. Land it before the thesis.
-->

---

## Empathy is a decision, not a script

<p class="quote-big">"Empathy is not primarily what you say. It is how you decide what kind of help to give, and how much."</p>

<p style="margin-top:20px;"><span class="accent">QuietBridge makes silence, burden triage, and escalation first-class actions</span>, not response-styling.</p>

<!--
This is the spine of the deck. Say it, pause. Everything after this slide is proof of this sentence.
-->

---

## Five care modes, combinable not exclusive

<div class="cards cards-5">
<div class="card"><h4>WITNESS</h4><p>Acknowledge. Zero follow-up questions.</p></div>
<div class="card"><h4>ORGANISE</h4><p>Extract one action. Queue the rest.</p></div>
<div class="card"><h4>QUIET</h4><p>Minimal UI. Minimal or no speech.</p></div>
<div class="card"><h4>SOFTEN</h4><p>Emotional holding. No advice.</p></div>
<div class="card"><h4>ESCALATE</h4><p>Crisis mode. Routes to real help.</p></div>
</div>

<!--
Emphasize "combinable": a real state is often two modes at once, e.g. QUIET + ORGANISE.
-->

---

## Three panels: Heard, Chose, Did

<div class="cards cards-3">
<div class="card"><h4>What I Heard</h4><p>Mood declared via plain-language chips, never clinical words.</p></div>
<div class="card"><h4>What I Chose</h4><p>The visible care-state, and why. Not a black box.</p></div>
<div class="card"><h4>What I Did</h4><p>One action. Word-capped. Nothing else demanded tonight.</p></div>
</div>

<p class="subtle" style="margin-top:20px;">Chips: "There's too much" · "I feel nothing" · "It's hitting me" · "I'm scared about something" · "I'd rather not say"</p>

<!--
Mood chips avoid diagnostic language on purpose: a clinical label invites the person to argue with it instead of picking it.
-->

---

## The LLM perceives. Code decides.

<p class="quote-big" style="font-size:1.25em;">The pre-built answer to "isn't this just prompt styling?"</p>

<div class="cards cards-2" style="margin-top:24px;">
<div class="card"><h4>Deterministic, not vibes</h4><p>Mode selection, priority scoring, crisis first-pass, and check-in-vs-stay-quiet all run in code.</p></div>
<div class="card"><h4>Enforced after generation</h4><p>Word caps: QUIET 25 · WITNESS 35 · SOFTEN 45 · ORGANISE/ESCALATE 60. Speed: ESCALATE 0.80x · QUIET 0.85x · SOFTEN 0.90x.</p></div>
</div>

<!--
Preempts the two hardest judge questions: "isn't this just prompt styling" and "isn't this just if-statements." Say both out loud.
-->

---

## Crisis safety works with no network

<div class="cards cards-2">
<div class="card"><h4>The classifier runs first</h4><p>Local 25-term, recall-biased lexicon. Returns before any network call. False positives are fine. False negatives are not.</p></div>
<div class="card"><h4>The copy is disciplined</h4><p>≤45 words. No moralising. Never "I'm just an AI." No euphemism: "died," never "journey."</p></div>
</div>

<div class="cards cards-3" style="margin-top:16px;">
<div class="card"><h4>999 / A&amp;E</h4><p>Unsafe right now.</p></div>
<div class="card"><h4>NHS 111</h4><p>Urgent, not immediate.</p></div>
<div class="card"><h4>Samaritans 116 123</h4><p>Someone to listen.</p></div>
</div>

<!--
Say plainly: this classifier works even with the wifi off. That's the point.
-->

---

<span class="tag-notbuilt">Not built</span>

## We rejected the camera, on purpose

<div class="cards cards-4">
<div class="card"><h4>The inference isn't sound</h4><p>Barrett, Adolphs, Marsella, Martinez &amp; Pollak (2019), <em>Emotional Expressions Reconsidered</em>. Facial movements don't reliably signal specific emotions across people and contexts. A grieving flat face and a bored flat face are the same face.</p></div>
<div class="card"><h4>Wrong data class</h4><p>Biometric-class data under UK GDPR, and squarely in the EU AI Act's line of fire.</p></div>
<div class="card"><h4>Contradicts the thesis</h4><p>A camera prompt before the first sentence is the loudest demand in the product.</p></div>
<div class="card"><h4>Most fragile thing on stage</h4><p>One failed permission dialog, and the demo is about a broken camera.</p></div>
</div>

<p class="quote-big" style="margin-top:14px; font-size:1.15em;">The rejection is a stronger answer than the feature.</p>

<!--
Say "not built" plainly: this is where it goes next, not a claim the system reads faces today.
-->

---

## The decision is real. Delivery is simulated.

<div class="cards cards-2">
<div class="card"><h4>What's real</h4><p>The decision to check in or stay quiet is computed, recorded, and inspectable.</p></div>
<div class="card"><h4>What's simulated</h4><p>The actual delivery of a check-in: this build doesn't send one.</p></div>
</div>

<p class="subtle" style="margin-top:18px;">The seam: <code>check_in_decisions</code> is a drainable outbox with <code>due_at</code> + <code>delivery_state</code>. No routing or memory changes needed to make it real.</p>

<p class="subtle">Time-Shift simulator: 3 stops, permanently labelled "Simulator — moves the clock, not real time."</p>

<p class="subtle">The button reads "I can stay quiet now." One tap, no confirmation, 12-hour window. Screen reduces to: "I'll be here. Nothing until tomorrow."</p>

<!--
A judge WILL ask "so it never actually reaches out?" Say the honest answer before they ask it.
-->

---

## Built for all four criteria

<div class="cards cards-4">
<div class="card"><h4>Originality</h4><p>A third thing: a decision engine for care, not a companion or a rewrite filter.</p></div>
<div class="card"><h4>Technical Execution</h4><p>939 LOC. Deterministic router, local crisis lexicon, cache-backed voice, honest degradation.</p></div>
<div class="card"><h4>Applicability</h4><p>Recall-biased safety, word caps enforced in code. A front door, not a Sage competitor.</p></div>
<div class="card"><h4>Fit to the Brief</h4><p>Remembers, decides, acts, and restrains itself, all visible in the first 90 seconds.</p></div>
</div>

<!--
One breath per card. Summary slide before the mic-drop. Keep pace up.
-->

---

<!-- _paginate: false -->
# One manageable next step

<p class="quote-big" style="margin-top:20px;">"I noticed this person is overwhelmed. So I chose not to perform empathy at them. I reduced the world to one manageable next step."</p>

<p class="subtle" style="margin-top:24px;">QuietBridge · Track 1: Presence</p>

<!--
Land on silence. Don't talk over the last line. Let it sit for two seconds before Q&A.
-->
