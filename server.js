import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { route } from './src/router.js';
import { synthesize, voiceEnabled } from './src/voice.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(express.static(join(__dirname, 'public')));

// Demo timeline stops (FR-DEMO-002). Fixed dates so the demo is reproducible.
const TIME_STOPS = {
  DAY1: '2026-03-02T03:00:00',
  DAY4: '2026-03-05T11:00:00',
  DAY14: '2026-03-15T20:00:00',
};

// Single in-memory session. CON-003: synthetic data only, nothing persisted.
const session = {
  sim_now: TIME_STOPS.DAY1,
  mood: null,
  mood_source: 'none',
  channel: 'text',
  quiet_until: null,
  turns: [],
  facts: [],
  last: null,
};

const inQuietWindow = () => Boolean(session.quiet_until)
  && new Date(session.sim_now) < new Date(session.quiet_until);

function publicState() {
  return {
    sim_now: session.sim_now,
    mood: session.mood,
    mood_source: session.mood_source,
    channel: session.channel,
    quiet_until: session.quiet_until,
    in_quiet_window: inQuietWindow(),
    facts: session.facts,
    turn_count: session.turns.length,
    voice_enabled: voiceEnabled(),
    care_state: session.last,
  };
}

app.get('/v1/state', (req, res) => res.json(publicState()));

app.post('/v1/mood', (req, res) => {
  const { mood, channel } = req.body ?? {};
  const allowed = ['OVERWHELMED', 'NUMB', 'RAW', 'ANXIOUS'];
  // CRISIS is system-set only and never selectable (FR-ADAPT-006).
  if (mood === null || allowed.includes(mood)) {
    session.mood = mood ?? null;
    session.mood_source = mood ? 'declared' : 'none';
  }
  if (channel === 'voice' || channel === 'text') session.channel = channel;
  res.json(publicState());
});

app.post('/v1/ingest', async (req, res) => {
  const { text, sim_now: simNow } = req.body ?? {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: { code: 'EMPTY_INPUT', message: 'Nothing to read.' } });
  }
  if (simNow) session.sim_now = simNow;

  try {
    const careState = await route({
      text: String(text),
      simNow: session.sim_now,
      declaredMood: session.mood,
      moodSource: session.mood_source,
    });

    // Typing exits quiet; the system never asks them to (FR-QUIET-007).
    session.quiet_until = null;
    session.turns.push({ at: session.sim_now, text: String(text), care_state: careState });

    if (careState.facts?.length) {
      const seen = new Set(session.facts.map((f) => f.text));
      session.facts.push(...careState.facts.filter((f) => f.text && !seen.has(f.text)));
      session.facts = session.facts.slice(-6);
    }
    // A declared mood is authoritative; an inferred one only fills a blank.
    if (!session.mood && careState.mood && careState.mood !== 'CRISIS') {
      session.mood = careState.mood;
      session.mood_source = 'inferred';
    }
    if (careState.mood === 'CRISIS') {
      session.mood = 'CRISIS';
      session.mood_source = 'system';
    }
    session.last = careState;

    return res.json({ care_state: careState, state: publicState() });
  } catch (err) {
    console.error('[ingest]', err);
    return res.status(500).json({
      error: { code: 'ROUTER_FAILED', message: 'That did not go through. Your note is saved.' },
    });
  }
});

app.post('/v1/quiet', (req, res) => {
  const hours = Number(req.body?.hours) || 12;
  const until = new Date(new Date(session.sim_now).getTime() + hours * 3600 * 1000);
  session.quiet_until = until.toISOString().slice(0, 19);
  res.json(publicState());
});

app.delete('/v1/quiet', (req, res) => {
  session.quiet_until = null;
  res.json(publicState());
});

app.post('/v1/speech', async (req, res) => {
  const { text, speed } = req.body ?? {};
  if (!voiceEnabled()) return res.status(204).end();
  try {
    const out = await synthesize(String(text ?? ''), Number(speed) || 1.0);
    if (!out) return res.status(204).end();
    res.set('Content-Type', 'audio/mpeg').set('X-Cached', String(out.cached));
    return res.send(out.audio);
  } catch (err) {
    console.error('[speech]', err.message);
    return res.status(204).end();
  }
});

app.post('/v1/demo/time-shift', (req, res) => {
  const { stop, sim_now: simNow } = req.body ?? {};
  if (stop && TIME_STOPS[stop]) session.sim_now = TIME_STOPS[stop];
  else if (simNow) session.sim_now = simNow;
  res.json(publicState());
});

app.post('/v1/session/reset', (req, res) => {
  Object.assign(session, {
    sim_now: TIME_STOPS.DAY1,
    mood: null,
    mood_source: 'none',
    channel: 'text',
    quiet_until: null,
    turns: [],
    facts: [],
    last: null,
  });
  res.json(publicState());
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`QuietBridge on http://localhost:${port}  (voice: ${voiceEnabled() ? 'on' : 'off'})`);
});
