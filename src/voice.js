import { createHash } from 'node:crypto';

// Cached by (text + voice + speed) so demo rehearsal does not re-bill
// the same sentence twenty times (FR-VOICE-009).
const cache = new Map();

export function voiceEnabled() {
  return (process.env.VOICE_MODE || 'off') === 'elevenlabs'
    && Boolean(process.env.ELEVENLABS_API_KEY)
    && Boolean(process.env.ELEVENLABS_VOICE_ID);
}

export async function synthesize(text, speed = 1.0) {
  if (!voiceEnabled() || !text) return null;

  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  // CON-006 clamp. Outside this range it stops sounding like a person.
  const rate = Math.min(1.2, Math.max(0.7, Number(speed) || 1.0));
  const key = createHash('sha1').update(`${text}|${voiceId}|${rate}`).digest('hex');

  if (cache.has(key)) return { audio: cache.get(key), cached: true };

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.55, similarity_boost: 0.75, speed: rate },
      }),
    },
  );

  // Voice is an enhancement, never a dependency. Failure is silent to the
  // user and the text path carries on unchanged (FR-VOICE-008).
  if (!res.ok) {
    console.error('[voice] failed:', res.status, (await res.text()).slice(0, 160));
    return null;
  }

  const audio = Buffer.from(await res.arrayBuffer());
  cache.set(key, audio);
  return { audio, cached: false };
}
