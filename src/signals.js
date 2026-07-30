// Deterministic signal extraction and mode decision.
// No I/O, no network, no LLM. The safety path lives here so it still works
// when the model is slow, wrong, or unreachable (RISK-001, FR-ROUTER-015).

// Recall-biased: a false positive costs one unnecessary escalation card,
// a false negative costs everything (ASM-006, FR-SAFE-001).
const CRISIS_TERMS = [
  'kill myself', 'killing myself', 'end my life', 'ending my life',
  'want to die', 'wanna die', 'better off dead', 'not worth living',
  'no point living', 'no reason to live', 'take my own life',
  'suicide', 'suicidal', 'self harm', 'self-harm', 'hurt myself',
  'hurting myself', 'overdose', "can't go on", 'cant go on',
  'give up on life', 'join her', 'join him', 'be with her again',
  'be with him again', 'disappear forever',
];

const ADMIN_TERMS = [
  'bank', 'banks', 'probate', 'solicitor', 'lawyer', 'will', 'estate',
  'insurance', 'pension', 'mortgage', 'landlord', 'council', 'tax',
  'hmrc', 'dwp', 'benefits', 'form', 'forms', 'paperwork', 'admin',
  'certificate', 'registrar', 'register', 'funeral', 'undertaker',
  'employer', 'work', 'utilities', 'bills', 'account', 'accounts',
  'passport', 'licence', 'license', 'subscription', 'deadline',
  'tell us once', 'notify', 'notification', 'claim', 'payment',
];

const FATIGUE_TERMS = [
  "can't", 'cant', 'exhausted', 'tired', 'no energy', 'too much',
  'overwhelmed', 'drowning', 'so much', 'everything', 'nothing',
  "don't know", 'dont know', 'stuck', 'numb', 'empty', 'blank',
  'sleep', "haven't slept", 'havent slept', 'awake',
];

const ANXIETY_TERMS = [
  'worried', 'worry', 'scared', 'afraid', 'what if', 'panic',
  'anxious', 'money', 'afford', 'owe', 'debt', 'deadline', 'late',
  'penalty', 'fine', 'legal', 'court', 'wrong',
];

const count = (text, terms) => terms.filter((t) => text.includes(t)).length;

export function crisisCheck(text) {
  const t = String(text || '').toLowerCase();
  const hits = CRISIS_TERMS.filter((term) => t.includes(term));
  return { hit: hits.length > 0, terms: hits };
}

// NIGHT is the load-bearing bucket: it changes the mode for identical text.
export function timeBucket(simNow) {
  const h = new Date(simNow).getHours();
  if (h >= 22 || h < 6) return 'NIGHT';
  if (h < 12) return 'MORNING';
  if (h < 18) return 'AFTERNOON';
  return 'EVENING';
}

export function extractSignals(text, simNow) {
  const t = String(text || '').toLowerCase();
  const words = t.split(/\s+/).filter(Boolean);
  const sentences = t.split(/[.!?]+/).filter((s) => s.trim());

  const admin = Math.min(100, count(t, ADMIN_TERMS) * 18);
  const fatigue = Math.min(100, count(t, FATIGUE_TERMS) * 16 + (words.length > 60 ? 20 : 0));
  const anxiety = Math.min(100, count(t, ANXIETY_TERMS) * 18);

  // Short and clipped reads as shutdown; long and unpunctuated reads as flooding.
  const avgSentence = sentences.length ? words.length / sentences.length : words.length;
  const fragmentation = words.length < 8 ? 80 : Math.min(100, Math.round(avgSentence * 2));

  return {
    time_bucket: timeBucket(simNow),
    admin_density: admin,
    fatigue,
    anxiety,
    fragmentation,
    word_count: words.length,
  };
}

// Deterministic. The LLM perceives; this decides. That split is the
// engineering claim the demo makes (RISK-013).
export function decideModes(signals, { crisis = false, declaredMood = null } = {}) {
  if (crisis) {
    return {
      modes: ['ESCALATE'],
      mood: 'CRISIS',
      rationale: ['A crisis signal was detected in what you said.', 'Everything else is set aside.'],
    };
  }

  const night = signals.time_bucket === 'NIGHT';
  const modes = [];
  const rationale = [];

  if (night) {
    modes.push('QUIET');
    rationale.push('It is the middle of the night. Nothing here needs doing now.');
  }

  if (signals.admin_density >= 40) {
    modes.push('ORGANISE');
    rationale.push(`You named ${Math.round(signals.admin_density / 18)} things that want handling.`);
  } else if (signals.fatigue >= 45) {
    modes.push('SOFTEN');
    rationale.push('You sound worn through. No task belongs here.');
  } else if (signals.fragmentation >= 70 && signals.word_count < 15) {
    modes.push('WITNESS');
    rationale.push('You said very little. I am not going to ask for more.');
  }

  if (!modes.length) {
    modes.push('WITNESS');
    rationale.push('Nothing here is urgent. I am just here.');
  }

  if (signals.anxiety >= 40) {
    rationale.push('Some of this is fear about what happens next, not a task.');
  }

  const mood = declaredMood && declaredMood !== 'CRISIS'
    ? declaredMood
    : inferMood(signals, modes);

  return { modes: [...new Set(modes)], mood, rationale: rationale.slice(0, 4) };
}

function inferMood(signals, modes) {
  if (signals.admin_density >= 40) return 'OVERWHELMED';
  if (signals.anxiety >= 40) return 'ANXIOUS';
  if (signals.fragmentation >= 70 && signals.word_count < 15) return 'NUMB';
  if (modes.includes('SOFTEN')) return 'RAW';
  return null;
}

// Enforced in code, not in the prompt. Prompts drift under time pressure
// and a warm 200-word reply would undo the entire thesis (RISK-011).
export const WORD_CAPS = {
  QUIET: 25,
  WITNESS: 35,
  SOFTEN: 45,
  ORGANISE: 60,
  ESCALATE: 60,
};

export function capFor(modes) {
  return Math.min(...modes.map((m) => WORD_CAPS[m] ?? 60));
}

export function capWords(text, cap) {
  const words = String(text || '').trim().split(/\s+/);
  if (words.length <= cap) return String(text || '').trim();
  const cut = words.slice(0, cap).join(' ');
  const lastStop = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('?'));
  return lastStop > cut.length * 0.5 ? cut.slice(0, lastStop + 1) : `${cut}.`;
}

// Playback speed per mode (FR-VOICE-002), clamped to [0.7, 1.2] by CON-006.
export function speedFor(modes) {
  if (modes.includes('ESCALATE')) return 0.8;
  if (modes.includes('QUIET')) return 0.85;
  if (modes.includes('SOFTEN')) return 0.9;
  return 1.0;
}
