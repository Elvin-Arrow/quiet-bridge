import {
  crisisCheck, extractSignals, decideModes, capFor, capWords, speedFor,
} from './signals.js';

const API = 'https://api.openai.com/v1/chat/completions';

const CRISIS_RESPONSE =
  'I am not the right help for this, and I do not want to leave you with nothing. '
  + 'Samaritans are on 116 123, free, any hour. NHS 111 is there too. If you are in danger now, call 999.';

// The model perceives. It does not decide the mode and it does not write
// the final copy unconstrained — both are enforced downstream.
const PERCEPTION_PROMPT = `You extract structured observations from a message written by someone recently bereaved. You do not advise, comfort, or reply.

Return JSON only:
{
  "facts": [{"text": "<short third-person fact, max 10 words>", "source": "stated|inferred"}],
  "tasks": [{"title": "<admin task named or implied, max 8 words>", "urgency": 1-5}],
  "who_died": "<relation only, e.g. 'mother', or null>",
  "reads_as": "<one clause, max 12 words, describing their state>"
}

Rules: facts max 5, tasks max 6. Never invent a task they did not imply. Use the relation ("your mother"), never "loved one". Say "died", never "passed away".`;

const RESPONSE_PROMPT = `You are QuietBridge. You speak to someone who has not slept and has capacity for one decision.

Hard rules:
- Max WORDCAP words. Shorter is better.
- No questions. Zero. Never end with a question.
- No emoji, no exclamation marks, no praise, no encouragement.
- Never say: journey, healing, closure, loved one, passed away, strong, brave, unimaginable, sorry for your loss.
- Say "died". Use the relation ("your mother").
- Second person, present tense, active voice.
- Prefer permission over instruction: "You don't have to do all of this."
- Never describe your own effort.
- The "time" field tells you when it is. Only say "tonight" when time is NIGHT. Never say "tonight" in the MORNING or AFTERNOON.
- If you name an action, do not then say that action can wait. The action IS the one thing worth doing. Only the rest waits.

Mode meanings:
QUIET — say almost nothing. Acknowledge, then stop. Offer no task.
WITNESS — acknowledge what they said. No follow-up, no task.
SOFTEN — hold what they feel. No action items, no advice.
ORGANISE — name ONE next step and say plainly that the rest can wait.

Return JSON only:
{"response": "<the reply>", "action": {"step": "<one concrete step, max 10 words>", "why": "<why this one and not the others, max 15 words>", "est_minutes": <int>} or null}

Set action to null unless ORGANISE is in the mode set.`;

async function callOpenAI(messages, { retry = true } = {}) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(raw);
  } catch (err) {
    if (!retry) throw new Error(`unparseable model output: ${raw.slice(0, 120)}`);
    // One repair attempt, then the deterministic fallback takes over.
    return callOpenAI(
      [...messages,
        { role: 'assistant', content: raw },
        { role: 'user', content: 'That was not valid JSON. Return only the JSON object.' }],
      { retry: false },
    );
  }
}

export async function route({ text, simNow, declaredMood = null, moodSource = 'none' }) {
  const signals = extractSignals(text, simNow);
  const crisis = crisisCheck(text);
  const decision = decideModes(signals, { crisis: crisis.hit, declaredMood });
  const cap = capFor(decision.modes);

  const base = {
    modes: decision.modes,
    mood: decision.mood,
    mood_source: decision.mood ? (declaredMood ? moodSource : 'inferred') : 'none',
    rationale: decision.rationale,
    signals,
    speed: speedFor(decision.modes),
    parked_count: 0,
    facts: [],
    degraded: false,
    crisis_terms: crisis.terms,
  };

  // Crisis never touches the network. It must work when nothing else does.
  if (crisis.hit) {
    return { ...base, response: CRISIS_RESPONSE, action: null };
  }

  try {
    const perception = await callOpenAI([
      { role: 'system', content: PERCEPTION_PROMPT },
      { role: 'user', content: text },
    ]);

    const tasks = Array.isArray(perception.tasks) ? perception.tasks : [];
    const facts = Array.isArray(perception.facts) ? perception.facts.slice(0, 5) : [];

    const generated = await callOpenAI([
      { role: 'system', content: RESPONSE_PROMPT.replace('WORDCAP', String(cap)) },
      {
        role: 'user',
        content: JSON.stringify({
          modes: decision.modes,
          reads_as: perception.reads_as ?? null,
          who_died: perception.who_died ?? null,
          tasks,
          time: signals.time_bucket,
          message: text,
        }),
      },
    ]);

    const organising = decision.modes.includes('ORGANISE');
    const action = organising && generated.action?.step
      ? {
        step: String(generated.action.step),
        why: String(generated.action.why ?? ''),
        est_minutes: Number(generated.action.est_minutes) || 5,
      }
      : null;

    return {
      ...base,
      // The cap is applied here, after generation. The prompt asks; the code enforces.
      response: capWords(generated.response ?? '', cap),
      action,
      parked_count: organising ? Math.max(0, tasks.length - 1) : tasks.length,
      facts: facts.map((f, i) => ({
        id: `f${i}`,
        text: String(f.text ?? ''),
        source: f.source === 'inferred' ? 'inferred' : 'stated',
      })),
      who_died: perception.who_died ?? null,
    };
  } catch (err) {
    // Honest degradation: route on time and workload alone, and say so.
    console.error('[router] degraded:', err.message);
    return {
      ...base,
      degraded: true,
      response: capWords(fallbackResponse(decision.modes), cap),
      action: null,
    };
  }
}

function fallbackResponse(modes) {
  if (modes.includes('QUIET')) return 'I have got this. Nothing needs you tonight.';
  if (modes.includes('SOFTEN')) return 'That is a lot to be carrying. You do not have to do anything with it right now.';
  if (modes.includes('ORGANISE')) return 'There is a lot here. One thing at a time, and not all of it tonight.';
  return 'I heard you.';
}
