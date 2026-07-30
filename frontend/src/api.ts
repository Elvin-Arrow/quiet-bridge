import type { Mood, SessionState, Task, TurnResponse } from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'
const SESSION_KEY = 'quietbridge_session_id'

function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSessionId(),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(
      body?.error?.user_message ??
        'That did not go through. Your note is still here.',
    )
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function initialiseSession(): Promise<SessionState> {
  const sessionId = getSessionId()
  await request('/v1/session', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      timezone: 'Europe/London',
      locale: 'en-GB',
    }),
  })
  return request(`/v1/session/${sessionId}/state`)
}

export function getState(): Promise<SessionState> {
  return request(`/v1/session/${getSessionId()}/state`)
}

export function ingest(
  text: string,
  simNow?: string,
  declaredMood?: Mood,
): Promise<TurnResponse> {
  return request('/v1/ingest', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({
      text,
      sim_now: simNow,
      client_local_time: new Date().toISOString(),
      declared_mood: declaredMood,
    }),
  })
}

export function seedScenario(
  scenario:
    | 'MAYA_DAY1'
    | 'ADMIN_FATIGUE_DAY4'
    | 'ISOLATION_DAY14'
    | 'RISKY_LEGAL_PROMPT'
    | 'CRISIS_SIGNAL',
): Promise<SessionState> {
  return request('/v1/demo/seed', {
    method: 'POST',
    body: JSON.stringify({ scenario }),
  })
}

export function timeShift(stop: 'DAY_1' | 'DAY_4' | 'DAY_14'): Promise<SessionState> {
  return request('/v1/demo/time-shift', {
    method: 'POST',
    body: JSON.stringify({ stop }),
  })
}

export function activateQuiet(hours: 12 | 24 | null = 12): Promise<{
  quiet: SessionState['quiet']
  check_in_decision: NonNullable<SessionState['check_in_decision']>
}> {
  return request('/v1/quiet', {
    method: 'POST',
    body: JSON.stringify({ hours }),
  })
}

export function exitQuiet(): Promise<void> {
  return request('/v1/quiet', { method: 'DELETE' })
}

export function setTaskState(
  taskId: string,
  state: 'NEXT_STEP' | 'NOT_TONIGHT' | 'DONE' | 'NOT_MINE',
): Promise<{ task: Task; next_step: Task | null; not_tonight: Task[] }> {
  return request(`/v1/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ state }),
  })
}

export function addDoNotAsk(factKey: string, topic: string) {
  return request('/v1/memory/do-not-ask', {
    method: 'POST',
    body: JSON.stringify({ fact_key: factKey, topic }),
  })
}

export function setMood(declaredMood: Mood) {
  return request('/v1/memory/preferences', {
    method: 'PATCH',
    body: JSON.stringify({ declared_mood: declaredMood }),
  })
}

export function compareStory(text: string) {
  return request<{
    results: Array<{
      sim_now: string
      care_state: NonNullable<SessionState['care_state']>
      response_text: string
      next_step: Task | null
    }>
  }>('/v1/demo/compare', {
    method: 'POST',
    body: JSON.stringify({
      text,
      clocks: [
        '2026-07-30T14:00:00.000+01:00',
        '2026-07-30T03:00:00.000+01:00',
      ],
    }),
  })
}
