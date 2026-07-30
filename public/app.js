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

let startedAt = 0;

async function startRecording() {
  if (recording) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      .find((m) => MediaRecorder.isTypeSupported(m)) || '';
    recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const actual = recorder.mimeType || mime || 'audio/webm';
    chunks = [];
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      submitAudio(new Blob(chunks, { type: actual }), actual);
    };
    // Timeslice so chunks land every 250ms rather than only on stop —
    // a stop that never fires would otherwise lose the whole recording.
    recorder.start(250);
    recording = true;
    startedAt = Date.now();
    $('mic').classList.add('recording');
    $('mic').textContent = 'Listening — let go to send';
    console.log('[voice] recording as', actual);
  } catch (err) {
    console.error('[voice] mic denied:', err.name);
    $('mic').textContent = 'I need microphone access';
    $('response').textContent = 'I need permission to use the microphone. Check the address bar.';
  }
}

function stopRecording() {
  if (!recording || !recorder) return;
  // Ignore an instant release — a click is not a sentence, and stopping a
  // recorder before it has produced a chunk yields an empty blob.
  if (Date.now() - startedAt < 400) {
    $('mic').textContent = 'Hold it down while you speak';
    setTimeout(() => { $('mic').textContent = 'Hold to talk'; }, 1600);
  }
  recording = false;
  $('mic').classList.remove('recording');
  if ($('mic').textContent === 'Listening — let go to send') $('mic').textContent = 'Hold to talk';
  try { recorder.stop(); } catch (err) { console.error('[voice] stop:', err.message); }
  recorder = null;
}

async function submitAudio(blob, mime) {
  console.log('[voice] captured', blob.size, 'bytes as', mime);

  // Never fail silently. A dropped recording that shows nothing is
  // indistinguishable from the app ignoring the person.
  if (blob.size < 800) {
    $('response').textContent = 'That was too short. Hold the button while you speak.';
    return;
  }
  if (audioEl) { audioEl.pause(); audioEl = null; }
  $('response').textContent = 'Listening back.';

  let text;
  try {
    const res = await fetch('/v1/listen', {
      method: 'POST',
      headers: { 'Content-Type': mime },
      body: blob,
    });
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error?.code ?? `http_${res.status}`);
    ({ text } = payload);
    if (!text) throw new Error('empty_transcript');
  } catch (err) {
    console.error('[voice] listen failed:', err.message);
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
mic.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  // Capture the pointer so sliding off the button mid-sentence does not
  // cut the recording — the old mouseleave handler was doing exactly that.
  try { mic.setPointerCapture(e.pointerId); } catch (err) { /* not critical */ }
  startRecording();
});
mic.addEventListener('pointerup', (e) => {
  e.preventDefault();
  try { mic.releasePointerCapture(e.pointerId); } catch (err) { /* not critical */ }
  stopRecording();
});
mic.addEventListener('pointercancel', stopRecording);
// Space bar works too — easier to hold steady on stage than a mouse button.
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && channel === 'voice' && document.activeElement !== $('input') && !e.repeat) {
    e.preventDefault(); startRecording();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && channel === 'voice') { e.preventDefault(); stopRecording(); }
});

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
