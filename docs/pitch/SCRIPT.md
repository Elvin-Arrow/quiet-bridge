# QuietBridge: Pitch Script

Solo pitch. No hand-offs. Total run time below: **170s spoken / 180s hard cap** (10s buffer).

A note on numbers: this script uses the exact mode → word-cap → speed table from
`REQUIREMENTS.md` §5.2.3 (the normative delivery-policy matrix), not the rounded
figures in the original brief. Maya's message is a Day-1, 3AM overload case, which
routes to `{ORGANISE, QUIET}`: 35-word cap, 0.85x speed. Standalone `QUIET` alone
caps at 15 words. See the correction note at the bottom of this file.

---

## 1. Timed script (0:00–2:50, 170s used of 180s cap)

Running totals shown in the margin. Read `[pause]` as silence, not a breath. If you
lose count, err longer, not shorter.

**[0:00–0:18 | HOOK | running 18s]**

> "QuietBridge turns one overwhelmed voice note into the right kind of help —
> not necessarily a reply. [pause] Sometimes that means a gentle sentence.
> Sometimes it means one draft email, one practical step, and silence until
> tomorrow."

Say this slowly. It's the whole pitch in one breath, so don't rush to get past it.

**[0:18–0:30 | INSIGHT | running 30s]**

"Here's the insight the whole build sits on. [pause, half-beat] Empathy is not
primarily what you say. It is how you decide what kind of help to give, and
how much."

**[0:30–0:46 | SOLUTION | running 46s]**

"So we built five modes: Witness, Organise, Quiet, Soften, Escalate. [emphasis]
One rule underneath all of them: the LLM perceives, deterministic code
decides. Mode choice and priority are code, not a prompt's guess."

**[0:46–2:17 | DEMO | running 137s]** (see delivery-guide notes below for what's
happening on screen at each step)

- *[0:46–0:58, 12s]* "This is the entry screen. I pick a channel, then tap a
  mood chip: 'There's too much.' Watch the screen. The theme shifts with the
  mood I picked."
- *[0:58–1:08, 10s]* (Type while speaking, the typed text IS the narration.)
  "Her mum died last night. Work keeps messaging. The bank wants documents.
  She hasn't slept. Please don't make me do ten things."
- *[1:08–1:21, 13s]* "Three panels render. What I Heard, the memory of what
  she said. What I Chose, the care state, and why. What I Did, the actual
  output. Perceive, decide, act. In that order. Visible."
- *[1:21–1:33, 12s]* "The reply is short. This is Organise plus Quiet,
  capped at thirty-five words, enforced in code after generation, not just
  asked for in a prompt."
- *[1:33–1:41, 8s]* "Optionally, ElevenLabs speaks it, slowed to
  zero-point-eight-five for a quiet-mode reply."
- *[1:41–2:01, 20s: THE PEAK]* "One tap. No 'are you sure.' Watch." [TAP]
  **[pause: 8 full seconds of silence, screen only]** The screen reduces to
  one line: *"I'll be here. Nothing until tomorrow."* [let it sit] "That's the
  emotional core of this build."
- *[2:01–2:17, 16s]* "Up top: Day 1 at 3 AM, Day 4 at 11 AM, Day 14 at 8 PM.
  Labelled 'Simulator — moves the clock, not real time.' I'm saying that out
  loud, on purpose."

**[2:17–2:32 | IMPACT | running 152s]**

"Nothing here is faked as more finished than it is. The decision to check in
or stay quiet is real, and logged. Delivery is simulated. The table's
already shaped like a drainable outbox. That's the seam, not a rewrite."

**[2:32–2:50 | CLOSE | running 170s]**

> [slow] "I noticed this person is overwhelmed. [pause] So I chose not to
> perform empathy at them. [pause] I reduced the world to one manageable next
> step. [pause] That's QuietBridge."

Stop talking. Let the last line be the last sound in the room.

---

## 2. Delivery guide

- **Overall pace:** brisk through Hook/Insight/Solution (0:00 to 0:46). You're
  earning the right to slow down later. Drop pace by about 30% for the Demo
  section; drop it further for Impact and Close.
- **The two places to shut up entirely:**
  1. **The 8-second silence after the quiet-button tap (1:41–2:01).** This is
     not a rhetorical pause. Count eight full seconds in your head. Let the
     single line on screen do the work. Resist the urge to fill it.
  2. **After the final line of the Close.** Do not say "thank you" over it.
     Stop, let it land for a beat, then step back or nod to signal you're
     done.
- **Slow down on:** the hook's second half ("silence until tomorrow"), the
  word "died" whenever it appears (never soften it, never rush past it), and
  every word of the Close.
- **Emphasis words:** "not a reply" (hook), "deterministic code decides"
  (solution), "real, and logged" versus "simulated" (impact, the contrast is
  the point, let both words land separately).
- **Body:** stand, don't hover behind the laptop. Look at the judges during
  Hook, Insight, Close. Look at the screen only during the Demo block, and
  even then glance back to the judges during the 8-second silence. Watch
  their faces, not yours.
- **Hand-offs:** solo pitch, no hand-offs, no seam lines needed.

---

## 3. Demo narration, keyed to screen state

Standalone reference table for rehearsing the demo block without the app open.
Left column is what's physically on screen; right column is the exact words.

| Screen state | Exact words |
|---|---|
| Entry screen, channel + mood chips visible | "This is the entry screen. I pick a channel, then tap a mood chip: 'There's too much.' Watch the screen. The theme shifts with the mood I picked." |
| Text box, empty, cursor blinking | "Her mum died last night. Work keeps messaging. The bank wants documents. She hasn't slept. Please don't make me do ten things." (typed as spoken) |
| Three panels rendered: What I Heard / What I Chose / What I Did | "Three panels render. What I Heard, the memory of what she said. What I Chose, the care state, and why. What I Did, the actual output. Perceive, decide, act. In that order. Visible." |
| Reply text visible under "What I Did," 35 words, Organise+Quiet badge | "The reply is short. This is Organise plus Quiet, capped at thirty-five words, enforced in code after generation, not just asked for in a prompt." |
| Play button next to reply (tap-to-play, no autoplay) | "Optionally, ElevenLabs speaks it, slowed to zero-point-eight-five for a quiet-mode reply." |
| "I can stay quiet now" button, single tap, no dialog | "One tap. No 'are you sure.' Watch." [TAP] (8s silence) |
| Screen collapsed to one line: "I'll be here. Nothing until tomorrow." | (silence, then) "That's the emotional core of this build." |
| Time-Shift header: Day 1·03:00 → Day 4·11:00 → Day 14·20:00, "Simulator" label visible | "Up top: Day 1 at 3 AM, Day 4 at 11 AM, Day 14 at 8 PM. Labelled 'Simulator — moves the clock, not real time.' I'm saying that out loud, on purpose." |

Never claim on stage: the compare toggle, a judge-attack button, drafts/"Not
Tonight" queue contents, Tell Us Once / Death Notification Service
integration, voice input, persistence across restart, Lovable, BimpeAI,
Render.

---

## 4. Judge Q&A objection bank

Each answer is word-counted and fits under 40 spoken words. Give the answer,
then stop; don't keep talking past the landing point.

**1. "Isn't this just if-statements with an LLM wrapper?"**
"That split is the engineering claim, not an excuse. The LLM perceives:
reads the note, estimates load. Deterministic code decides the mode. That
means mode choice is inspectable, reproducible, and testable. A prompt is
none of those three." *(38 words)*

**2. "So it never actually reaches out to you?"**
"Fair, I won't dress it up. The decision to check in or stay quiet is real,
recorded, inspectable. Delivery is simulated. The table's already shaped as a
drainable outbox: due date, delivery state. That's the one seam left."
*(38 words)*

**3. "Why not read the user's face or emotion with the camera?"**
"We considered it, and rejected it. A grieving flat face and a bored flat
face look the same: facial expressions don't reliably map to emotions. It's
biometric data under UK GDPR. Not built. Not coming soon." *(36 words)*

**4. "How is this different from EverSettled's Sage?"**
"We're not competing with Sage. We're the front door to it. Sage helps you
through the estate workflow once you're ready to be in one. QuietBridge
decides whether tonight is a night you should be in a workflow at all."
*(40 words)*

**5. "What happens if the model or the network fails?"**
"The crisis classifier is deterministic, local, and runs before any network
call. It works with the network fully cut off. Everything else degrades to
a short, honest acknowledgement instead of an unguarded LLM response. It
fails closed, not open." *(39 words)*

**6. "What if it misreads the mood?"**
"Worst case, the screen is the wrong colour. Mood only drives the theme, the
chip you tap on entry. It never touches routing. It can't make the system
say the wrong thing." *(32 words)*

**7. "Is this safe? Are you giving legal or medical advice?"**
"No, and we designed against it. Never a therapist, doctor, or solicitor.
Never clinical language about the user, never role-plays the deceased, never
says 'loved one.' The word is 'died.' Crisis routes to three tappable links:
999, NHS 111, Samaritans." *(40 words)*

**8. "What's not built?"**
"The compare toggle. Voice input: you can't speak into it, only type.
Persistence across a restart. Rather tell you than have you catch me. The
real seam, the outbox table, is already shaped, just waiting on a drain loop."
*(38 words)*

**9 (bonus). "Why should we believe restraint is a feature and not you
running out of time?"**
"Because it costs us engineering, not saves it. Word caps are enforced in
code after generation: QUIET mode caps speech at fifteen words. The quiet
button has no confirmation dialog. Restraint that costs something is
restraint you meant." *(38 words)*

---

## 5. The 30-second cut

Use verbatim if they say "you have thirty seconds."

> "QuietBridge turns one overwhelmed voice note into the right kind of help,
> not necessarily a reply. Sometimes that's a gentle sentence. Sometimes it's
> one draft email and silence until tomorrow. The LLM perceives; deterministic
> code decides what kind of help, and how much. Watch: one tap, no 'are you
> sure.' [pause] 'I'll be here. Nothing until tomorrow.' That's QuietBridge."

(~27s at a measured pace, including the pause.)

---

## Correction note (for the team, not for stage)

The original brief said word caps were "QUIET 25, WITNESS 35, SOFTEN 45,
ORGANISE and ESCALATE 60." The normative table in `REQUIREMENTS.md` lines
361–371 gives different numbers per exact mode *combination*, not per single
mode in isolation:

| Mode set | Max words | Speed |
|---|---|---|
| `{WITNESS}` | 25 | 0.95 |
| `{SOFTEN}` | 40 | 0.90 |
| `{QUIET}` | 15 | 0.85 |
| `{ORGANISE}` | 60 | 1.00 |
| `{ORGANISE, QUIET}` | 35 | 0.85 |
| `{ORGANISE, WITNESS}` | 50 | 0.95 |
| `{SOFTEN, QUIET}` | 20 | 0.85 |
| `{WITNESS, QUIET}` | 15 | 0.85 |
| `{ESCALATE}` | 45 | 0.80 |

Maya's message routes to `{ORGANISE, QUIET}` (Day-1 3AM overload, per
`IDEA.md` line 51), so the demo beat and Q&A #9 use **35 words** and
**0.85x**, not the brief's rounded figures. The 0.80/0.85/0.90 speed tiers by
mode-family (Escalate/Quiet-containing/Soften) were correct in the brief and
are unchanged here.
