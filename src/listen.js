// Speech in. The other half of the conversation — without this, "Talk" is
// a label on a button that does nothing.

export function listenEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function transcribe(buffer, mimeType = 'audio/webm') {
  if (!listenEnabled() || !buffer?.length) return null;

  const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), `note.${ext}`);
  form.append('model', 'whisper-1');
  // Someone crying at 3am is not enunciating. Bias the decode toward the
  // domain so "probate" and "Tell Us Once" survive a shaky recording.
  form.append('prompt', 'A voice note from someone recently bereaved, about admin: bank, probate, pension, registrar, Tell Us Once, funeral, landlord, employer.');
  form.append('language', 'en');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    console.error('[listen] failed:', res.status, (await res.text()).slice(0, 160));
    return null;
  }

  const json = await res.json();
  return typeof json.text === 'string' ? json.text.trim() : null;
}
