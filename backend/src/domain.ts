import { randomUUID } from "node:crypto";

export type Mode = "WITNESS" | "ORGANISE" | "QUIET" | "SOFTEN" | "ESCALATE";
export type TimeOfDay = "NIGHT" | "MORNING" | "AFTERNOON" | "EVENING";
export type Mood = "NUMB" | "ANXIOUS" | "OVERWHELMED" | "SAD" | "UNDECLARED";
export type Scenario =
  | "MAYA_DAY1"
  | "ADMIN_FATIGUE_DAY4"
  | "ISOLATION_DAY14"
  | "RISKY_LEGAL_PROMPT"
  | "CRISIS_SIGNAL";

export interface RouterSignals {
  time_of_day: TimeOfDay;
  local_hour: number;
  fatigue_level: number;
  grief_level: number;
  admin_density: number;
  legal_risk_level: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "AMBIGUOUS";
  energy_score: number;
  question_tolerance: number;
  crisis_level: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  explicit_preferences: Array<{ key: string; value: unknown; quote_span?: string }>;
  admin_demands_detected: number;
  extraction_model: string;
}

export interface CareState {
  care_state_id: string;
  session_id: string;
  turn_id: string;
  created_at: string;
  sim_now: string;
  stretch_day: number;
  modes: Mode[];
  signals: RouterSignals;
  rationale: Array<{ clause: string; signal: string; value: unknown }>;
  confidence: number;
  delivery: {
    max_actions: 0 | 1;
    voice_enabled: boolean;
    voice_autoplay: boolean;
    voice_speed: number;
    max_reply_words: number;
    questions_allowed: 0;
    queue_visibility: "hidden" | "collapsed" | "expanded";
  };
  safe_pivot: boolean;
  degraded: boolean;
  suppression_window_id: string | null;
}

export interface CanonicalFact {
  fact_id: string;
  key: string;
  value: string | number | boolean | null;
  display: string;
  confidence: number;
  source_event_id: string;
  source_type: "VOICE" | "TEXT" | "INFERRED" | "SEED";
  first_seen_at: string;
  last_confirmed_at: string;
  superseded_by: string | null;
  archived: boolean;
}

export interface MemoryKernel {
  session_id: string;
  updated_at: string;
  canonical_facts: CanonicalFact[];
  preferences: {
    max_actions: 0 | 1;
    no_stacked_questions: boolean;
    no_phone_calls: boolean;
    quiet_preferred: boolean;
    short_replies_at_night: boolean;
    voice_enabled: boolean;
    declared_mood: Mood;
  };
  do_not_ask: Array<{
    id: string;
    topic: string;
    fact_key: string | null;
    created_at: string;
    origin: "USER_EXPLICIT" | "INFERRED";
  }>;
}

export interface Task {
  task_id: string;
  session_id: string;
  title: string;
  first_step: string;
  state: "NEXT_STEP" | "NOT_TONIGHT" | "DONE" | "NOT_MINE" | "ARCHIVED";
  category: "EMPLOYMENT" | "BANKING" | "GOVERNMENT" | "FUNERAL" | "LEGAL" | "FAMILY" | "OTHER";
  grounded_service: "TELL_US_ONCE" | "DEATH_NOTIFICATION_SERVICE" | "REGISTRAR" | "NONE";
  urgency: number;
  blocking: boolean;
  effort_minutes_estimate: number;
  emotional_cost: number;
  priority_score: number;
  surface_after: string | null;
  created_at: string;
  state_changed_at: string;
  origin: "EXTRACTED" | "SEED" | "USER_CREATED";
  source_event_id: string | null;
  chosen_over: string[];
}

export interface Draft {
  draft_id: string;
  session_id: string;
  task_id: string | null;
  kind:
    | "WORK_MESSAGE"
    | "BANK_CALL_SCRIPT"
    | "TELL_US_ONCE_PREP"
    | "DNS_PREP"
    | "PROFESSIONAL_QUESTION"
    | "FAMILY_UPDATE";
  title: string;
  body: string;
  format: "PLAIN" | "NUMBERED_SCRIPT" | "CHECKLIST";
  placeholders: Array<{ token: string; where_to_find: string }>;
  substitution_note: string | null;
  created_at: string;
  edited_by_user: boolean;
  certainty_audit: { passed: boolean; rewrites: number; flagged_phrases: string[] };
  model_tier: "FAST" | "REASON" | "TEMPLATE";
}

export interface SafetyVerdict {
  verdict_id: string;
  turn_id: string;
  evaluated_at: string;
  crisis: {
    level: "NONE" | "LOW" | "MEDIUM" | "HIGH";
    categories: string[];
    classifier: "DETERMINISTIC" | "DETERMINISTIC+LLM";
    llm_confirmed: boolean | null;
  };
  domain_risk: {
    level: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "AMBIGUOUS";
    domains: string[];
    matched_patterns: string[];
  };
  certainty_audit: {
    passed: boolean;
    rewrites: number;
    blocked_directives: number;
    flagged_phrases: string[];
  };
  do_not_ask_violations_blocked: number;
  synthetic_data_flags: string[];
  action: "ALLOW" | "SAFE_PIVOT" | "ESCALATE" | "FAIL_CLOSED";
  escalation_routes: Array<{ label: string; contact: string; when: string }>;
}

export interface CheckInDecision {
  decision_id: string;
  session_id: string;
  evaluated_at: string;
  sim_now: string;
  stretch_day: number;
  decision: "CHECK_IN" | "STAY_QUIET";
  reasons: Array<{ code: string; detail: string }>;
  surfaced_task_id: string | null;
  next_evaluation_at: string | null;
  min_gap_hours: number;
  suppression_window: {
    window_id: string;
    starts_at: string;
    ends_at: string;
    origin: string;
  } | null;
  would_have_delivered_at: string | null;
  would_have_used_channel: "IN_APP" | null;
  due_at: string | null;
  delivery_state: "PENDING" | "DELIVERED" | "SUPPRESSED" | "EXPIRED";
}

export interface SessionEvent {
  event_id: string;
  session_id: string;
  turn_id: string | null;
  type: string;
  occurred_at: string;
  sim_now: string;
  payload: Record<string, unknown>;
  model: {
    tier: "FAST" | "REASON" | "NONE";
    tokens_in: number;
    tokens_out: number;
    estimated_cost_usd: number;
  } | null;
  latency_ms: number | null;
}

export interface SessionState {
  session: {
    session_id: string;
    created_at: string;
    locale: "en-GB";
    timezone: "Europe/London";
    sim_now: string;
    stretch: {
      started_at: string;
      current_day: number;
      last_contact_at: string | null;
      consecutive_unanswered_check_ins: number;
    };
    scenario_seed: Scenario | null;
    demo_mode: boolean;
  };
  memory: MemoryKernel;
  care_state: CareState | null;
  tasks: Task[];
  drafts: Draft[];
  check_in_decision: CheckInDecision | null;
  quiet: { active: boolean; ends_at: string | null; window_id: string | null };
  events: SessionEvent[];
  last_input: string | null;
  response_text: string | null;
}

export interface TurnResult {
  turn_id: string;
  transcript: string;
  care_state: CareState;
  safety_verdict: SafetyVerdict;
  memory: MemoryKernel;
  response: {
    text: string;
    word_count: number;
    speech: { enabled: false; autoplay: false; speed: number; audio_url: null };
  };
  next_step: Task | null;
  not_tonight: Task[];
  drafts: Draft[];
  check_in_decision: CheckInDecision;
}

interface DemandTemplate {
  key: string;
  matches: RegExp[];
  title: string;
  first_step: string;
  category: Task["category"];
  grounded_service: Task["grounded_service"];
  urgency: number;
  blocking: boolean;
  effort: number;
  emotionalCost: number;
  draftKind?: Draft["kind"];
}

const DEMANDS: DemandTemplate[] = [
  {
    key: "work",
    matches: [/\bwork\b/i, /\bemployer\b/i, /\bboss\b/i, /\bhr\b/i],
    title: "Tell work you are not available",
    first_step: "Send this two-line message to work",
    category: "EMPLOYMENT",
    grounded_service: "NONE",
    urgency: 85,
    blocking: true,
    effort: 2,
    emotionalCost: 20,
    draftKind: "WORK_MESSAGE",
  },
  {
    key: "bank",
    matches: [/\bbank\b/i, /\baccount\b/i, /\bfinancial institution\b/i],
    title: "Reply to the bank document request",
    first_step: "Copy the bank request into one note",
    category: "BANKING",
    grounded_service: "NONE",
    urgency: 62,
    blocking: true,
    effort: 8,
    emotionalCost: 55,
    draftKind: "BANK_CALL_SCRIPT",
  },
  {
    key: "tell-us-once",
    matches: [/\btell us once\b/i, /\bgovernment\b/i, /\bcouncil\b/i],
    title: "Prepare details for Tell Us Once",
    first_step: "Find the death certificate reference",
    category: "GOVERNMENT",
    grounded_service: "TELL_US_ONCE",
    urgency: 42,
    blocking: false,
    effort: 10,
    emotionalCost: 45,
    draftKind: "TELL_US_ONCE_PREP",
  },
  {
    key: "dns",
    matches: [/\bdeath notification service\b/i, /\bnotify.*banks?\b/i],
    title: "Prepare the Death Notification Service details",
    first_step: "List the banks that need notifying",
    category: "BANKING",
    grounded_service: "DEATH_NOTIFICATION_SERVICE",
    urgency: 38,
    blocking: false,
    effort: 8,
    emotionalCost: 48,
    draftKind: "DNS_PREP",
  },
  {
    key: "registrar",
    matches: [/\bregistrar\b/i, /\bdeath certificate\b/i],
    title: "Prepare the registrar details",
    first_step: "Put the registrar letter somewhere safe",
    category: "GOVERNMENT",
    grounded_service: "REGISTRAR",
    urgency: 55,
    blocking: true,
    effort: 5,
    emotionalCost: 50,
  },
];

const DELIVERY: Record<string, CareState["delivery"]> = {
  WITNESS: policy(0, 0.95, 25, "collapsed"),
  SOFTEN: policy(0, 0.9, 40, "hidden"),
  QUIET: policy(0, 0.85, 15, "hidden"),
  ORGANISE: policy(1, 1, 60, "collapsed"),
  "ORGANISE,QUIET": policy(1, 0.85, 35, "hidden"),
  "ORGANISE,WITNESS": policy(1, 0.95, 50, "collapsed"),
  "SOFTEN,QUIET": policy(0, 0.85, 20, "hidden"),
  "WITNESS,QUIET": policy(0, 0.85, 15, "hidden"),
  ESCALATE: policy(0, 0.8, 45, "hidden"),
};

function policy(
  maxActions: 0 | 1,
  speed: number,
  maxWords: number,
  queue: CareState["delivery"]["queue_visibility"],
): CareState["delivery"] {
  return {
    max_actions: maxActions,
    voice_enabled: false,
    voice_autoplay: false,
    voice_speed: speed,
    max_reply_words: maxWords,
    questions_allowed: 0,
    queue_visibility: queue,
  };
}

export function createEmptyState(
  sessionId: string = randomUUID(),
  now = new Date().toISOString(),
): SessionState {
  return {
    session: {
      session_id: sessionId,
      created_at: now,
      locale: "en-GB",
      timezone: "Europe/London",
      sim_now: now,
      stretch: {
        started_at: now,
        current_day: 1,
        last_contact_at: null,
        consecutive_unanswered_check_ins: 0,
      },
      scenario_seed: null,
      demo_mode: true,
    },
    memory: {
      session_id: sessionId,
      updated_at: now,
      canonical_facts: [],
      preferences: {
        max_actions: 1,
        no_stacked_questions: true,
        no_phone_calls: false,
        quiet_preferred: false,
        short_replies_at_night: true,
        voice_enabled: false,
        declared_mood: "UNDECLARED",
      },
      do_not_ask: [],
    },
    care_state: null,
    tasks: [],
    drafts: [],
    check_in_decision: null,
    quiet: { active: false, ends_at: null, window_id: null },
    events: [],
    last_input: null,
    response_text: null,
  };
}

export function getTimeOfDay(iso: string): { bucket: TimeOfDay; hour: number } {
  const date = new Date(iso);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "Europe/London",
    }).format(date),
  );
  if (hour >= 22 || hour < 6) return { bucket: "NIGHT", hour };
  if (hour < 12) return { bucket: "MORNING", hour };
  if (hour < 18) return { bucket: "AFTERNOON", hour };
  return { bucket: "EVENING", hour };
}

export function getStretchDay(state: SessionState, simNow: string): number {
  const elapsed = new Date(simNow).getTime() - new Date(state.session.stretch.started_at).getTime();
  return Math.max(1, Math.min(14, Math.floor(elapsed / 86_400_000) + 1));
}

export function detectCrisis(text: string): {
  level: RouterSignals["crisis_level"];
  categories: string[];
} {
  const high: Array<[RegExp, string]> = [
    [/\b(kill|end) myself\b/i, "SUICIDAL_INTENT"],
    [/\bsuicide\b/i, "SUICIDAL_IDEATION"],
    [/\bself[- ]?harm\b/i, "SELF_HARM"],
    [/\bhurt (myself|someone)\b/i, "HARM"],
    [/\bnot safe right now\b/i, "IMMEDIATE_DANGER"],
    [/\boverdose\b/i, "MEDICAL_EMERGENCY"],
  ];
  const categories = high.filter(([pattern]) => pattern.test(text)).map(([, category]) => category);
  if (categories.length > 0) return { level: "HIGH", categories };
  if (/\b(no point|cannot go on|can't go on|hopeless)\b/i.test(text)) {
    return { level: "MEDIUM", categories: ["HOPELESSNESS"] };
  }
  return { level: "NONE", categories: [] };
}

export function detectDomainRisk(text: string): {
  level: RouterSignals["legal_risk_level"];
  domains: string[];
  matched_patterns: string[];
} {
  const patterns: Array<[RegExp, string]> = [
    [/\b(move|take|withdraw|empty|transfer).{0,30}\b(money|funds|account)\b/i, "ACCESS_TO_FUNDS"],
    [/\bprobate\b|\bgrant of representation\b/i, "PROBATE"],
    [/\bwill\b.{0,20}\b(dispute|inherit|valid)\b/i, "WILLS_INHERITANCE"],
    [/\binheritance tax\b|\btax\b/i, "TAX"],
    [/\btransfer.{0,20}\b(property|house)\b/i, "PROPERTY"],
  ];
  const matches = patterns.filter(([pattern]) => pattern.test(text));
  return {
    level: matches.length > 0 ? "HIGH" : "NONE",
    domains: matches.map(([, domain]) => domain),
    matched_patterns: matches.map(([pattern]) => pattern.source),
  };
}

export function extractDeterministicSignals(
  text: string,
  simNow: string,
  openTaskCount: number,
): RouterSignals {
  const { bucket, hour } = getTimeOfDay(simNow);
  const crisis = detectCrisis(text);
  const domain = detectDomainRisk(text);
  const demands = detectDemandTemplates(text);
  const exhaustion = /\b(haven't|have not|not|no)\s+(slept|sleep)\b|\bexhausted\b|\btoo tired\b/i.test(text);
  const tired = exhaustion || /\btired\b|\bawake all night\b/i.test(text);
  const death = /\b(died|death|dead|bereavement|funeral)\b/i.test(text);
  const grief = death ? 88 : /\bgrief|sad|miss (him|her|them)\b/i.test(text) ? 75 : 35;
  const fatigue = exhaustion ? 92 : tired ? 72 : bucket === "NIGHT" ? 55 : 30;
  const lowTolerance = /\b(don't|do not).{0,25}\b(ask|things|questions)\b|\bone thing\b|\btoo much\b/i.test(text);
  const preferences: RouterSignals["explicit_preferences"] = [];
  if (lowTolerance) {
    preferences.push({ key: "max_actions", value: 1, quote_span: "low tolerance for multiple demands" });
    preferences.push({ key: "no_stacked_questions", value: true });
  }
  const adminDensity = Math.min(100, demands.length * 25 + Math.min(openTaskCount, 5) * 8);
  return {
    time_of_day: bucket,
    local_hour: hour,
    fatigue_level: fatigue,
    grief_level: grief,
    admin_density: adminDensity,
    legal_risk_level: domain.level,
    energy_score: Math.max(5, 100 - fatigue),
    question_tolerance: lowTolerance ? 10 : fatigue >= 70 ? 25 : 65,
    crisis_level: crisis.level,
    explicit_preferences: preferences,
    admin_demands_detected: demands.length,
    extraction_model: "deterministic-fallback",
  };
}

export function mergeSignalScores(
  base: RouterSignals,
  extracted: Partial<Pick<RouterSignals, "fatigue_level" | "grief_level" | "energy_score" | "question_tolerance">>,
  model: string,
): RouterSignals {
  const clamp = (value: number | undefined, fallback: number) =>
    value === undefined ? fallback : Math.max(0, Math.min(100, Math.round(value)));
  return {
    ...base,
    fatigue_level: clamp(extracted.fatigue_level, base.fatigue_level),
    grief_level: clamp(extracted.grief_level, base.grief_level),
    energy_score: clamp(extracted.energy_score, base.energy_score),
    question_tolerance: clamp(extracted.question_tolerance, base.question_tolerance),
    extraction_model: model,
  };
}

export function decideCareState(
  state: SessionState,
  turnId: string,
  signals: RouterSignals,
  simNow: string,
  degraded = false,
): CareState {
  const modes: Mode[] = [];
  const confidence = degraded ? 0.5 : 0.88;
  if (signals.crisis_level === "HIGH") {
    modes.push("ESCALATE");
  } else {
    const quiet =
      signals.time_of_day === "NIGHT" ||
      signals.energy_score <= 20 ||
      signals.question_tolerance <= 20 ||
      (signals.fatigue_level >= 60 && signals.energy_score <= 35) ||
      state.memory.preferences.quiet_preferred;
    const organise = signals.admin_density >= 40 && confidence >= 0.55;
    const soften = signals.grief_level >= 70 && signals.admin_density < 40;
    const witness =
      signals.grief_level >= 30 ||
      state.memory.preferences.declared_mood === "SAD" ||
      state.memory.preferences.declared_mood === "NUMB" ||
      state.memory.preferences.declared_mood === "ANXIOUS";
    if (organise) modes.push("ORGANISE");
    if (soften) modes.push("SOFTEN");
    if (witness && !soften && !organise) modes.push("WITNESS");
    if (quiet) modes.push("QUIET");
    if (modes.length === 0) modes.push("WITNESS");
    if (confidence < 0.55 && !modes.includes("QUIET")) modes.splice(0, modes.length, "WITNESS");
    if (confidence < 0.55 && modes.includes("QUIET")) modes.splice(0, modes.length, "WITNESS", "QUIET");
  }

  const rationale: CareState["rationale"] = [];
  if (signals.time_of_day === "NIGHT") {
    rationale.push({ clause: "late hour", signal: "time_of_day", value: signals.time_of_day });
  }
  if (signals.energy_score <= 20) {
    rationale.push({ clause: "very little energy", signal: "energy_score", value: signals.energy_score });
  }
  if (signals.admin_density >= 40) {
    rationale.push({ clause: "admin overload", signal: "admin_density", value: signals.admin_density });
  }
  if (signals.grief_level >= 70) {
    rationale.push({ clause: "recent grief", signal: "grief_level", value: signals.grief_level });
  }
  if (signals.legal_risk_level === "HIGH") {
    rationale.push({ clause: "professional guidance needed", signal: "legal_risk_level", value: "HIGH" });
  }
  if (signals.crisis_level === "HIGH") {
    rationale.splice(0, rationale.length, {
      clause: "urgent safety signal",
      signal: "crisis_level",
      value: "HIGH",
    });
  }
  while (rationale.length < 2) {
    rationale.push({
      clause: rationale.length === 0 ? "low immediate workload" : "short response preferred",
      signal: rationale.length === 0 ? "admin_density" : "question_tolerance",
      value: rationale.length === 0 ? signals.admin_density : signals.question_tolerance,
    });
  }

  const key = modes.join(",");
  return {
    care_state_id: randomUUID(),
    session_id: state.session.session_id,
    turn_id: turnId,
    created_at: new Date().toISOString(),
    sim_now: simNow,
    stretch_day: getStretchDay(state, simNow),
    modes,
    signals,
    rationale: rationale.slice(0, 4),
    confidence,
    delivery: DELIVERY[key] ?? DELIVERY.WITNESS!,
    safe_pivot: signals.legal_risk_level === "HIGH",
    degraded,
    suppression_window_id: state.quiet.window_id,
  };
}

export function processTurn(
  state: SessionState,
  text: string,
  simNow: string,
  signalOverride?: Partial<
    Pick<RouterSignals, "fatigue_level" | "grief_level" | "energy_score" | "question_tolerance">
  >,
  extractionModel = "deterministic-fallback",
): TurnResult {
  const started = Date.now();
  const turnId = randomUUID();
  const inputEventId = randomUUID();
  const baseSignals = extractDeterministicSignals(
    text,
    simNow,
    state.tasks.filter((task) => task.state === "NEXT_STEP" || task.state === "NOT_TONIGHT").length,
  );
  const signals = signalOverride
    ? mergeSignalScores(baseSignals, signalOverride, extractionModel)
    : baseSignals;
  const careState = decideCareState(state, turnId, signals, simNow, extractionModel === "llm-failed");
  const crisis = detectCrisis(text);
  const domain = detectDomainRisk(text);
  const syntheticFlags = detectSyntheticData(text);
  const safetyVerdict: SafetyVerdict = {
    verdict_id: randomUUID(),
    turn_id: turnId,
    evaluated_at: new Date().toISOString(),
    crisis: {
      level: crisis.level,
      categories: crisis.categories,
      classifier: "DETERMINISTIC",
      llm_confirmed: null,
    },
    domain_risk: domain,
    certainty_audit: {
      passed: true,
      rewrites: 0,
      blocked_directives: domain.level === "HIGH" ? 1 : 0,
      flagged_phrases: [],
    },
    do_not_ask_violations_blocked: 0,
    synthetic_data_flags: syntheticFlags,
    action:
      crisis.level === "HIGH" ? "ESCALATE" : domain.level === "HIGH" ? "SAFE_PIVOT" : "ALLOW",
    escalation_routes:
      crisis.level === "HIGH"
        ? [
            { label: "999 or A&E", contact: "999", when: "If you are not safe right now" },
            { label: "NHS 111", contact: "111", when: "For urgent mental-health help" },
            { label: "Samaritans", contact: "116123", when: "For confidential listening, any time" },
          ]
        : [],
  };

  state.session.sim_now = simNow;
  state.session.stretch.current_day = careState.stretch_day;
  state.last_input = text;
  state.care_state = careState;
  updateMemory(state, text, inputEventId, simNow);

  let turnTasks: Task[] = [];
  let turnDrafts: Draft[] = [];
  if (careState.modes.includes("ESCALATE")) {
    demoteCurrentNextStep(state, simNow);
  } else {
    turnTasks = createTasks(state, text, inputEventId, simNow, careState.modes.includes("ORGANISE"));
    turnDrafts = createDrafts(state, turnTasks, domain.level === "HIGH", simNow);
  }

  const responseText = composeResponse(careState, domain.level === "HIGH");
  state.response_text = responseText;
  state.drafts.push(...turnDrafts);
  state.memory.updated_at = simNow;

  if (
    careState.stretch_day === 1 &&
    signals.time_of_day === "NIGHT" &&
    careState.modes.includes("ORGANISE")
  ) {
    activateQuiet(state, simNow, 12, "DAY1_ACUTE");
    careState.suppression_window_id = state.quiet.window_id;
  }
  const checkIn = evaluateCheckIn(state, simNow);
  state.check_in_decision = checkIn;

  state.events.push(
    event(state, turnId, "INPUT_RECEIVED", simNow, { text }, null, 0),
    event(
      state,
      turnId,
      "SIGNALS_EXTRACTED",
      simNow,
      { signals },
      extractionModel.startsWith("openai")
        ? { tier: "FAST", tokens_in: 0, tokens_out: 0, estimated_cost_usd: 0 }
        : null,
      Date.now() - started,
    ),
    event(state, turnId, "CARE_STATE_DECIDED", simNow, { modes: careState.modes }, null, 0),
    event(state, turnId, "SAFETY_VERDICT", simNow, { action: safetyVerdict.action }, null, 0),
  );

  return {
    turn_id: turnId,
    transcript: text,
    care_state: careState,
    safety_verdict: safetyVerdict,
    memory: state.memory,
    response: {
      text: responseText,
      word_count: responseText.trim().split(/\s+/).length,
      speech: {
        enabled: false,
        autoplay: false,
        speed: careState.delivery.voice_speed,
        audio_url: null,
      },
    },
    next_step: state.tasks.find((task) => task.state === "NEXT_STEP") ?? null,
    not_tonight: state.tasks.filter((task) => task.state === "NOT_TONIGHT"),
    drafts: turnDrafts,
    check_in_decision: checkIn,
  };
}

function detectDemandTemplates(text: string): DemandTemplate[] {
  return DEMANDS.filter((demand) => demand.matches.some((pattern) => pattern.test(text)));
}

function scoreDemand(demand: DemandTemplate, energy: number): number {
  const effortScore = 100 - Math.min(100, (demand.effort / 60) * 100);
  const blockingScore = demand.blocking ? 100 : 0;
  const urgencyWeight = energy <= 30 ? 0.225 : 0.45;
  const emotionalWeight = energy <= 30 ? 0.6 : 0.3;
  return Number(
    (
      urgencyWeight * demand.urgency +
      0.25 * blockingScore +
      0.2 * effortScore -
      emotionalWeight * demand.emotionalCost
    ).toFixed(2),
  );
}

function createTasks(
  state: SessionState,
  text: string,
  sourceEventId: string,
  simNow: string,
  canSurface: boolean,
): Task[] {
  const existingTitles = new Set(
    state.tasks
      .filter((task) => !["DONE", "NOT_MINE", "ARCHIVED"].includes(task.state))
      .map((task) => task.title),
  );
  const templates = detectDemandTemplates(text).filter((demand) => !existingTitles.has(demand.title));
  const energy = state.care_state?.signals.energy_score ?? 50;
  const created = templates
    .map((demand) => ({
      demand,
      score: scoreDemand(demand, energy),
      id: randomUUID(),
    }))
    .sort((a, b) => b.score - a.score);

  const currentNext = state.tasks.find((task) => task.state === "NEXT_STEP");
  const mayChoose = canSurface && !currentNext;
  const tasks = created.map(({ demand, score, id }, index): Task => ({
    task_id: id,
    session_id: state.session.session_id,
    title: demand.title,
    first_step: demand.first_step,
    state: mayChoose && index === 0 ? "NEXT_STEP" : "NOT_TONIGHT",
    category: demand.category,
    grounded_service: demand.grounded_service,
    urgency: demand.urgency,
    blocking: demand.blocking,
    effort_minutes_estimate: demand.effort,
    emotional_cost: demand.emotionalCost,
    priority_score: score,
    surface_after:
      mayChoose && index === 0
        ? null
        : new Date(new Date(simNow).getTime() + 12 * 3_600_000).toISOString(),
    created_at: simNow,
    state_changed_at: simNow,
    origin: "EXTRACTED",
    source_event_id: sourceEventId,
    chosen_over: index === 0 ? created.slice(1).map((item) => item.id) : [],
  }));
  state.tasks.push(...tasks);
  return tasks;
}

function createDrafts(
  state: SessionState,
  tasks: Task[],
  safePivot: boolean,
  now: string,
): Draft[] {
  if (safePivot) {
    return [
      draft(
        state,
        null,
        "PROFESSIONAL_QUESTION",
        "Question for the bank",
        "Could you tell me what authority or documents you need before any money is moved from the account?",
        "PLAIN",
        now,
      ),
    ];
  }
  const next = tasks.find((task) => task.state === "NEXT_STEP");
  if (!next) return [];
  if (next.category === "EMPLOYMENT") {
    return [
      draft(
        state,
        next.task_id,
        "WORK_MESSAGE",
        "Message for work",
        "My mother died last night. I will not be available, and I will contact you when I know more.",
        "PLAIN",
        now,
      ),
    ];
  }
  return [];
}

function draft(
  state: SessionState,
  taskId: string | null,
  kind: Draft["kind"],
  title: string,
  body: string,
  format: Draft["format"],
  now: string,
): Draft {
  return {
    draft_id: randomUUID(),
    session_id: state.session.session_id,
    task_id: taskId,
    kind,
    title,
    body,
    format,
    placeholders: [],
    substitution_note: null,
    created_at: now,
    edited_by_user: false,
    certainty_audit: { passed: true, rewrites: 0, flagged_phrases: [] },
    model_tier: "TEMPLATE",
  };
}

function updateMemory(state: SessionState, text: string, eventId: string, now: string): void {
  const candidates: Array<[string, string, string, number]> = [];
  if (/\b(my )?(mum|mom|mother)\b/i.test(text) && /\b(died|dead|death)\b/i.test(text)) {
    candidates.push(["deceased.relation", "mother", "Your mother died.", 0.97]);
  } else if (/\b(my )?(dad|father)\b/i.test(text) && /\b(died|dead|death)\b/i.test(text)) {
    candidates.push(["deceased.relation", "father", "Your father died.", 0.97]);
  }
  if (/\bwork\b.{0,30}\b(message|contact|calling)\b|\bwork keeps\b/i.test(text)) {
    candidates.push(["user.employer_contact_pressure", "high", "Work keeps contacting you.", 0.9]);
  }
  if (/\b(haven't|have not|not|no)\s+(slept|sleep)\b/i.test(text)) {
    candidates.push(["user.sleep_state", "none", "You have not slept.", 0.95]);
  }
  if (/\bbank\b.{0,50}\b(document|paper|asked|request)\b/i.test(text)) {
    candidates.push(["admin.bank_request", "documents_requested", "The bank asked for documents.", 0.9]);
  }
  if (/\b(i('m| am)|feeling)\s+sad\b/i.test(text)) {
    candidates.push(["user.mood", "sad", "You said you are sad.", 0.92]);
  }
  if (/\b(i('m| am)|feeling)\s+(numb|empty)\b/i.test(text)) {
    candidates.push(["user.mood", "numb", "You said you feel numb.", 0.92]);
  }
  if (/\b(i('m| am)|feeling)\s+(anxious|worried|scared)\b/i.test(text)) {
    candidates.push(["user.mood", "anxious", "You said you feel anxious.", 0.9]);
  }
  if (/\b(i('m| am)|feeling)\s+overwhelmed\b/i.test(text)) {
    candidates.push(["user.mood", "overwhelmed", "You said you feel overwhelmed.", 0.9]);
  }
  for (const [key, value, display, confidence] of candidates) {
    const existing = state.memory.canonical_facts.find(
      (fact) => fact.key === key && fact.value === value && !fact.archived,
    );
    if (existing) {
      existing.last_confirmed_at = now;
      continue;
    }
    state.memory.canonical_facts.push({
      fact_id: randomUUID(),
      key,
      value,
      display,
      confidence,
      source_event_id: eventId,
      source_type: "TEXT",
      first_seen_at: now,
      last_confirmed_at: now,
      superseded_by: null,
      archived: false,
    });
  }
}

function composeResponse(careState: CareState, safePivot: boolean): string {
  if (careState.modes.includes("ESCALATE")) {
    return "You need immediate human support. Call 999 if you are unsafe now, NHS 111 for urgent help, or Samaritans on 116 123.";
  }
  if (safePivot) {
    return "I cannot give legal or financial advice. I drafted one question for the bank so you can check before anything is moved.";
  }
  const key = careState.modes.join(",");
  if (key === "ORGANISE,QUIET") {
    return "You do not need to sort everything tonight. I drafted one message for work. Everything else can wait.";
  }
  if (careState.modes.includes("ORGANISE")) {
    return "I reduced this to one next step. Everything else is waiting.";
  }
  if (careState.modes.includes("SOFTEN")) {
    return "This is a lot to carry. Nothing needs to be solved in this moment.";
  }
  if (careState.modes.includes("WITNESS")) {
    return "I heard you. You do not have to tidy this up for me.";
  }
  if (careState.modes.includes("QUIET")) {
    return "I am here with you. Nothing else is needed right now.";
  }
  return "I heard you. There is no pressure to explain more.";
}

export function activateQuiet(
  state: SessionState,
  simNow: string,
  hours: 12 | 24 | null,
  origin = "USER_QUIET_BUTTON",
): CheckInDecision {
  const start = new Date(simNow);
  const end = hours === null ? new Date("9999-12-31T23:59:59.000Z") : new Date(start.getTime() + hours * 3_600_000);
  state.memory.preferences.quiet_preferred = true;
  state.quiet = { active: true, ends_at: end.toISOString(), window_id: randomUUID() };
  state.events.push(
    event(state, null, "QUIET_ACTIVATED", simNow, { hours, origin }, null, 0),
  );
  return evaluateCheckIn(state, simNow);
}

export function exitQuiet(state: SessionState): void {
  state.quiet = { active: false, ends_at: null, window_id: null };
  state.memory.preferences.quiet_preferred = false;
}

export function evaluateCheckIn(state: SessionState, simNow: string): CheckInDecision {
  const now = new Date(simNow);
  if (state.quiet.active && state.quiet.ends_at && now >= new Date(state.quiet.ends_at)) {
    exitQuiet(state);
  }
  const day = getStretchDay(state, simNow);
  const { bucket } = getTimeOfDay(simNow);
  const dueTasks = state.tasks
    .filter(
      (task) =>
        task.state === "NOT_TONIGHT" &&
        (!task.surface_after || new Date(task.surface_after) <= now),
    )
    .sort((a, b) => {
      const groundedA = a.grounded_service === "TELL_US_ONCE" || a.grounded_service === "DEATH_NOTIFICATION_SERVICE";
      const groundedB = b.grounded_service === "TELL_US_ONCE" || b.grounded_service === "DEATH_NOTIFICATION_SERVICE";
      if (groundedA !== groundedB) return groundedA ? -1 : 1;
      return b.priority_score - a.priority_score;
    });

  let decision: CheckInDecision["decision"] = "STAY_QUIET";
  let surfacedTaskId: string | null = null;
  const reasons: CheckInDecision["reasons"] = [];
  if (state.quiet.active) {
    reasons.push({ code: "SUPPRESSION_ACTIVE", detail: "A quiet window is active." });
  } else if (bucket === "NIGHT" && day !== 14) {
    reasons.push({ code: "NIGHT_NO_URGENT", detail: "It is night and no urgent task needs surfacing." });
  } else if (day === 14) {
    decision = "CHECK_IN";
    reasons.push({ code: "ANCHOR_DAY_ENTERED", detail: "Day 14 offers company or continued silence." });
  } else if (day >= 4 && dueTasks.length > 0) {
    decision = "CHECK_IN";
    surfacedTaskId = dueTasks[0]?.task_id ?? null;
    reasons.push({ code: "QUEUE_ITEM_DUE", detail: "One deferred item is ready to surface." });
  } else {
    reasons.push({ code: "MIN_GAP_NOT_ELAPSED", detail: "There is no reason to interrupt yet." });
  }

  const dueAt = decision === "CHECK_IN" ? simNow : null;
  return {
    decision_id: randomUUID(),
    session_id: state.session.session_id,
    evaluated_at: new Date().toISOString(),
    sim_now: simNow,
    stretch_day: day,
    decision,
    reasons,
    surfaced_task_id: surfacedTaskId,
    next_evaluation_at:
      state.quiet.active && state.quiet.ends_at
        ? state.quiet.ends_at
        : new Date(now.getTime() + 20 * 3_600_000).toISOString(),
    min_gap_hours: 20,
    suppression_window:
      state.quiet.active && state.quiet.ends_at && state.quiet.window_id
        ? {
            window_id: state.quiet.window_id,
            starts_at: simNow,
            ends_at: state.quiet.ends_at,
            origin: "ACTIVE",
          }
        : null,
    would_have_delivered_at: dueAt,
    would_have_used_channel: decision === "CHECK_IN" ? "IN_APP" : null,
    due_at: dueAt,
    delivery_state: decision === "CHECK_IN" ? "PENDING" : "SUPPRESSED",
  };
}

export function seedScenario(state: SessionState, scenario: Scenario): SessionState {
  const day1 = "2026-07-30T03:00:00.000+01:00";
  const day4 = "2026-08-02T11:00:00.000+01:00";
  const day14 = "2026-08-12T20:00:00.000+01:00";
  const sessionId = state.session.session_id;
  const fresh = createEmptyState(sessionId, day1);
  Object.assign(state, fresh);
  state.session.scenario_seed = scenario;
  state.session.stretch.started_at = day1;

  if (scenario === "CRISIS_SIGNAL") {
    processTurn(state, "I am not safe right now and I want to kill myself.", day1);
    return state;
  }
  if (scenario === "RISKY_LEGAL_PROMPT") {
    processTurn(state, "My mother died. Can I just move the money from her account?", day1);
    return state;
  }

  processTurn(
    state,
    "My mum died last night. Work keeps messaging me. The bank asked for documents. I haven't slept. Please don't make me do ten things.",
    day1,
  );
  addSeededDeferredTasks(state, day1);
  if (scenario === "ADMIN_FATIGUE_DAY4") {
    exitQuiet(state);
    state.tasks.forEach((task) => {
      if (task.state === "NOT_TONIGHT") task.surface_after = day4;
    });
    state.session.sim_now = day4;
    state.session.stretch.current_day = 4;
    state.check_in_decision = evaluateCheckIn(state, day4);
  }
  if (scenario === "ISOLATION_DAY14") {
    exitQuiet(state);
    state.tasks.forEach((task) => {
      task.state = "DONE";
      task.state_changed_at = day14;
    });
    state.session.sim_now = day14;
    state.session.stretch.current_day = 14;
    const signals = extractDeterministicSignals("I am here.", day14, 0);
    state.care_state = decideCareState(state, randomUUID(), { ...signals, grief_level: 80 }, day14);
    state.response_text = "I am here. You can stay a while, or choose quiet.";
    state.check_in_decision = evaluateCheckIn(state, day14);
  }
  return state;
}

function addSeededDeferredTasks(state: SessionState, now: string): void {
  const existing = new Set(state.tasks.map((task) => task.grounded_service));
  const templates = DEMANDS.filter(
    (demand) =>
      ["TELL_US_ONCE", "DEATH_NOTIFICATION_SERVICE", "REGISTRAR"].includes(demand.grounded_service) &&
      !existing.has(demand.grounded_service),
  );
  for (const demand of templates) {
    state.tasks.push({
      task_id: randomUUID(),
      session_id: state.session.session_id,
      title: demand.title,
      first_step: demand.first_step,
      state: "NOT_TONIGHT",
      category: demand.category,
      grounded_service: demand.grounded_service,
      urgency: demand.urgency,
      blocking: demand.blocking,
      effort_minutes_estimate: demand.effort,
      emotional_cost: demand.emotionalCost,
      priority_score: scoreDemand(demand, 12),
      surface_after: new Date(new Date(now).getTime() + 3 * 86_400_000).toISOString(),
      created_at: now,
      state_changed_at: now,
      origin: "SEED",
      source_event_id: null,
      chosen_over: [],
    });
  }
}

export function setTaskState(
  state: SessionState,
  taskId: string,
  nextState: Task["state"],
  now: string,
): Task {
  const task = state.tasks.find((candidate) => candidate.task_id === taskId);
  if (!task) throw new Error("TASK_NOT_FOUND");
  if (["DONE", "NOT_MINE"].includes(task.state)) throw new Error("TASK_TERMINAL");
  if (nextState === "NEXT_STEP") {
    const incumbent = state.tasks.find((candidate) => candidate.state === "NEXT_STEP");
    if (incumbent && incumbent.task_id !== taskId) {
      incumbent.state = "NOT_TONIGHT";
      incumbent.state_changed_at = now;
    }
  }
  task.state = nextState;
  task.state_changed_at = now;
  return task;
}

function demoteCurrentNextStep(state: SessionState, now: string): void {
  const current = state.tasks.find((task) => task.state === "NEXT_STEP");
  if (current) {
    current.state = "NOT_TONIGHT";
    current.state_changed_at = now;
  }
}

function detectSyntheticData(text: string): string[] {
  const flags: string[] = [];
  if (/\b[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]\b/i.test(text)) flags.push("NI_NUMBER");
  if (/\b\d{2}-\d{2}-\d{2}\b/.test(text)) flags.push("SORT_CODE");
  if (/\b\d{11}\b/.test(text)) flags.push("NHS_NUMBER");
  if (/\b\d{8}\b/.test(text)) flags.push("ACCOUNT_NUMBER");
  return flags;
}

function event(
  state: SessionState,
  turnId: string | null,
  type: string,
  simNow: string,
  payload: Record<string, unknown>,
  model: SessionEvent["model"],
  latency: number,
): SessionEvent {
  return {
    event_id: randomUUID(),
    session_id: state.session.session_id,
    turn_id: turnId,
    type,
    occurred_at: new Date().toISOString(),
    sim_now: simNow,
    payload,
    model,
    latency_ms: latency,
  };
}

export function publicState(state: SessionState) {
  return {
    session: state.session,
    memory: state.memory,
    care_state: state.care_state,
    next_step: state.tasks.find((task) => task.state === "NEXT_STEP") ?? null,
    not_tonight: state.tasks.filter((task) => task.state === "NOT_TONIGHT"),
    drafts: state.drafts,
    check_in_decision: state.check_in_decision,
    quiet: state.quiet,
    response_text: state.response_text,
  };
}
