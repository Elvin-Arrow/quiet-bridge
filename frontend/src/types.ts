export type Mode = 'WITNESS' | 'ORGANISE' | 'QUIET' | 'SOFTEN' | 'ESCALATE'
export type Mood = 'NUMB' | 'ANXIOUS' | 'OVERWHELMED' | 'SAD' | 'UNDECLARED'

export interface CanonicalFact {
  fact_id: string
  key: string
  value: string | number | boolean | null
  display: string
  confidence: number
  source_type: 'VOICE' | 'TEXT' | 'INFERRED' | 'SEED'
}

export interface MemoryKernel {
  session_id: string
  updated_at: string
  canonical_facts: CanonicalFact[]
  preferences: {
    max_actions: 0 | 1
    no_stacked_questions: boolean
    no_phone_calls: boolean
    quiet_preferred: boolean
    short_replies_at_night: boolean
    voice_enabled: boolean
    declared_mood: Mood
  }
  do_not_ask: Array<{
    id: string
    topic: string
    fact_key: string | null
  }>
}

export interface CareState {
  care_state_id: string
  sim_now: string
  stretch_day: number
  modes: Mode[]
  rationale: Array<{ clause: string; signal: string; value: unknown }>
  confidence: number
  safe_pivot: boolean
  degraded: boolean
  delivery: {
    max_actions: 0 | 1
    voice_enabled: boolean
    voice_speed: number
    max_reply_words: number
    queue_visibility: 'hidden' | 'collapsed' | 'expanded'
  }
  signals: {
    time_of_day: 'NIGHT' | 'MORNING' | 'AFTERNOON' | 'EVENING'
    fatigue_level: number
    grief_level: number
    admin_density: number
    energy_score: number
    question_tolerance: number
    legal_risk_level: string
    crisis_level: string
    extraction_model: string
  }
}

export interface Task {
  task_id: string
  title: string
  first_step: string
  state: 'NEXT_STEP' | 'NOT_TONIGHT' | 'DONE' | 'NOT_MINE' | 'ARCHIVED'
  category: string
  grounded_service: string
  effort_minutes_estimate: number
  priority_score: number
}

export interface Draft {
  draft_id: string
  task_id: string | null
  kind: string
  title: string
  body: string
  format: 'PLAIN' | 'NUMBERED_SCRIPT' | 'CHECKLIST'
}

export interface CheckInDecision {
  decision_id: string
  stretch_day: number
  decision: 'CHECK_IN' | 'STAY_QUIET'
  reasons: Array<{ code: string; detail: string }>
  surfaced_task_id: string | null
  would_have_delivered_at: string | null
  delivery_state: 'PENDING' | 'DELIVERED' | 'SUPPRESSED' | 'EXPIRED'
  suppression_window: {
    window_id: string
    starts_at: string
    ends_at: string
    origin: string
  } | null
}

export interface SafetyVerdict {
  action: 'ALLOW' | 'SAFE_PIVOT' | 'ESCALATE' | 'FAIL_CLOSED'
  crisis: { level: string; categories: string[] }
  domain_risk: { level: string; domains: string[] }
  synthetic_data_flags: string[]
  escalation_routes: Array<{ label: string; contact: string; when: string }>
}

export interface SessionState {
  session: {
    session_id: string
    sim_now: string
    stretch: { current_day: number; started_at: string }
    scenario_seed: string | null
  }
  memory: MemoryKernel
  care_state: CareState | null
  next_step: Task | null
  not_tonight: Task[]
  drafts: Draft[]
  check_in_decision: CheckInDecision | null
  quiet: { active: boolean; ends_at: string | null; window_id: string | null }
  response_text: string | null
}

export interface TurnResponse {
  turn_id: string
  transcript: string
  care_state: CareState
  safety_verdict: SafetyVerdict
  memory: MemoryKernel
  response: {
    text: string
    word_count: number
    speech: { enabled: false; autoplay: false; speed: number; audio_url: null }
  }
  next_step: Task | null
  not_tonight: Task[]
  drafts: Draft[]
  check_in_decision: CheckInDecision
}
