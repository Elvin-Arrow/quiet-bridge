const $ = (id) => document.getElementById(id);
const MOOD_LABEL = {
  OVERWHELMED: "There's too much",
  NUMB: 'I feel nothing',
  RAW: "It's hitting me",
  ANXIOUS: "I'm scared about something",
  CRISIS: 'Crisis',
};

let channel = 'text';
let audioEl = null;

const post = (url, body) => fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function applyMood(mood) {
  if (mood) document.documentElement.setAttribute('data-mood', mood);
  else document.documentElement.removeAttribute('data-mood');
}

// Entry screen — one screen, both rows skippable.
document.querySelectorAll('#channel-row .chip').forEach((b) => {
  b.addEventListener('click', () => {
    channel = b.dataset.channel;
    applyChannel();
    document.querySelectorAll('#channel-row .chip').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
  });
});

document.querySelectorAll('#mood-row .chip, .skip').forEach((b) => {
  b.addEventListener('click', async () => {
    const mood = b.dataset.mood || null;
    applyMood(mood);
    await post('/v1/mood', { mood, channel });
    $('entry').hidden = true;
    $('input').focus();
  });
});

function applyChannel() {
  $('channel-toggle').textContent = channel === 'voice' ? 'Type' : 'Talk';
  $('mic').hidden = channel !== 'voice';
  $('input').hidden = channel === 'voice';
  $('send').hidden = channel === 'voice';
}

// Channel and mood are composer controls after entry, never a screen again (UX-08).
$('channel-toggle').addEventListener('click', async () => {
  channel = channel === 'voice' ? 'text' : 'voice';
  applyChannel();
  await post('/v1/mood', { channel });
});

$('mood-toggle').addEventListener('click', () => { $('entry').hidden = false; });

document.querySelectorAll('#shift .chip').forEach((b) => {
  b.addEventListener('click', async () => {
    document.querySelectorAll('#shift .chip').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    await post('/v1/demo/time-shift', { stop: b.dataset.stop });
  });
});

$('quiet-btn').addEventListener('click', async () => {
  if (audioEl) { audioEl.pause(); audioEl = null; }
  await post('/v1/quiet', { hours: 12 });
  document.body.classList.add('quiet');
  $('response').textContent = "I'll be here. Nothing until tomorrow.";
  $('action').hidden = true;
  $('quiet-btn').hidden = true;
  $('play').hidden = true;
});

// ---- Voice in -------------------------------------------------------------
// Hold to talk. Press-and-hold rather than tap-to-toggle because a
// half-open mic that nobody notices is the classic on-stage failure.
let recorder = null;
let chunks = [];
let recording = false;

async function startRecording() {
  if (recording) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
    recorder = new MediaRecorder(stream, { mimeType: mime });
    chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      submitAudio(new Blob(chunks, { type: mime }), mime);
    };
    recorder.start();
    recording = true;
    $('mic').classList.add('recording');
    $('mic').textContent = 'Listening — let go to send';
  } catch (err) {
    $('mic').textContent = 'I need the microphone';
  }
}

function stopRecording() {
  if (!recording || !recorder) return;
  recording = false;
  $('mic').classList.remove('recording');
  $('mic').textContent = 'Hold to talk';
  recorder.stop();
  recorder = null;
}

async function submitAudio(blob, mime) {
  if (blob.size < 2000) return; // a tap, not a sentence
  if (audioEl) { audioEl.pause(); audioEl = null; }
  $('response').textContent = 'Reading.';

  let text;
  try {
    const res = await fetch('/v1/listen', {
      method: 'POST',
      headers: { 'Content-Type': mime },
      body: blob,
    });
    if (!res.ok) throw new Error('listen');
    ({ text } = await res.json());
  } catch (err) {
    $('response').textContent = 'I did not catch that. Try again?';
    return;
  }
  // The transcript lands in What I heard before the router replies, so
  // voice and the panels never look out of step (UX-04).
  $('heard-empty').hidden = true;
  $('facts').innerHTML = `<li>${esc(text)}<span class="src">voice</span></li>${$('facts').innerHTML}`;
  await sendText(text);
}

const mic = $('mic');
mic.addEventListener('mousedown', startRecording);
mic.addEventListener('mouseup', stopRecording);
mic.addEventListener('mouseleave', stopRecording);
mic.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); });
mic.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); });

async function send() {
  const text = $('input').value.trim();
  if (!text) return;
  $('input').value = '';
  await sendText(text);
}

async function sendText(text) {
  document.body.classList.remove('quiet');
  $('response').textContent = 'Reading.';
  $('play').hidden = true;
  $('action').hidden = true;
  $('parked').hidden = true;

  let data;
  try {
    const res = await post('/v1/ingest', { text });
    if (!res.ok) throw new Error('failed');
    data = await res.json();
  } catch (err) {
    // Never blame the user, never show a status code (FR-UI-012).
    $('response').textContent = 'That did not go through. Your note is saved. Try again?';
    return;
  }

  render(data.care_state, data.state);
}

$('send').addEventListener('click', send);
$('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

function render(cs, state) {
  applyMood(cs.mood);

  const facts = state.facts ?? [];
  $('heard-empty').hidden = facts.length > 0;
  $('facts').innerHTML = facts
    .map((f) => `<li>${esc(f.text)}<span class="src">${esc(f.source)}</span></li>`)
    .join('');

  $('chose-empty').hidden = true;
  $('chose').hidden = false;
  $('modes').innerHTML = cs.modes.map((m) => `<span class="mode">${esc(m)}</span>`).join('');
  if (cs.mood) {
    $('mood-chip').hidden = false;
    $('mood-chip').textContent = `${MOOD_LABEL[cs.mood] ?? cs.mood} · ${cs.mood_source}`;
  } else {
    $('mood-chip').hidden = true;
  }
  $('rationale').innerHTML = (cs.rationale ?? []).map((r) => `<li>${esc(r)}</li>`).join('');
  $('degraded').hidden = !cs.degraded;

  $('response').textContent = cs.response;
  if (cs.action) {
    $('action').hidden = false;
    $('action-step').textContent = cs.action.step;
    $('action-why').textContent = `${cs.action.why} · about ${cs.action.est_minutes} min`;
  }
  if (cs.parked_count > 0) {
    $('parked').hidden = false;
    $('parked').textContent = `${cs.parked_count} other thing${cs.parked_count > 1 ? 's' : ''} can wait.`;
  }
  $('quiet-btn').hidden = false;

  speak(cs);
}

async function speak(cs) {
  if (!cs.response) return;
  const res = await post('/v1/speech', { text: cs.response, speed: cs.speed });
  if (res.status !== 200) return;

  const url = URL.createObjectURL(await res.blob());
  audioEl = new Audio(url);

  // QUIET never autoplays — an agent that can speak and chooses not to
  // is the whole point (FR-VOICE-003).
  if (cs.modes.includes('QUIET')) {
    $('play').hidden = false;
    $('play').onclick = () => audioEl.play();
  } else {
    audioEl.play().catch(() => {
      $('play').hidden = false;
      $('play').onclick = () => audioEl.play();
    });
  }
}

// Any interaction with the composer stops playback (FR-VOICE-007).
$('input').addEventListener('input', () => { if (audioEl) { audioEl.pause(); audioEl = null; } });
