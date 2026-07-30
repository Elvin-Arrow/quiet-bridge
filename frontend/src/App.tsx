import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  activateQuiet,
  addDoNotAsk,
  compareStory,
  exitQuiet,
  ingest,
  initialiseSession,
  seedScenario,
  setMood,
  setTaskState,
  timeShift,
} from './api'
import type {
  CheckInDecision,
  Draft,
  Mood,
  SafetyVerdict,
  SessionState,
  Task,
  TurnResponse,
} from './types'
import './App.css'

const MOODS: Array<{ value: Mood; label: string }> = [
  { value: 'NUMB', label: 'Numb' },
  { value: 'ANXIOUS', label: 'Anxious' },
  { value: 'OVERWHELMED', label: 'Overwhelmed' },
  { value: 'SAD', label: 'Sad' },
  { value: 'UNDECLARED', label: 'Rather not say' },
]

const DAY_LABELS = {
  DAY_1: 'Day 1 · 03:00',
  DAY_4: 'Day 4 · 11:00',
  DAY_14: 'Day 14 · 20:00',
} as const

function App() {
  const [state, setState] = useState<SessionState | null>(null)
  const [safety, setSafety] = useState<SafetyVerdict | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [queueOpen, setQueueOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [quietView, setQuietView] = useState(false)
  const [copiedDraft, setCopiedDraft] = useState<string | null>(null)
  const [compare, setCompare] = useState<
    Awaited<ReturnType<typeof compareStory>>['results'] | null
  >(null)

  useEffect(() => {
    initialiseSession()
      .then(setState)
      .catch((cause: unknown) => {
        setError(messageFrom(cause))
      })
      .finally(() => setLoading(false))
  }, [])

  const mood = state?.memory.preferences.declared_mood ?? 'UNDECLARED'
  const modes = state?.care_state?.modes ?? []
  const isEscalating = safety?.action === 'ESCALATE'

  const appMood = useMemo(
    () => mood.toLowerCase().replace('_', '-'),
    [mood],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || loading || !state) return

    setLoading(true)
    setError(null)
    setCompare(null)
    try {
      const result = await ingest(text, state.session.sim_now, mood)
      setState((current) => (current ? mergeTurn(current, result) : current))
      setSafety(result.safety_verdict)
      setInput('')
      setQuietView(false)
    } catch (cause) {
      setError(messageFrom(cause))
    } finally {
      setLoading(false)
    }
  }

  async function handleSeed(
    scenario:
      | 'MAYA_DAY1'
      | 'ADMIN_FATIGUE_DAY4'
      | 'ISOLATION_DAY14'
      | 'RISKY_LEGAL_PROMPT'
      | 'CRISIS_SIGNAL',
  ) {
    setLoading(true)
    setError(null)
    setSafety(null)
    setCompare(null)
    try {
      const next = await seedScenario(scenario)
      setState(next)
      setQuietView(false)
      if (scenario === 'CRISIS_SIGNAL') {
        setSafety({
          action: 'ESCALATE',
          crisis: { level: 'HIGH', categories: ['IMMEDIATE_DANGER'] },
          domain_risk: { level: 'NONE', domains: [] },
          synthetic_data_flags: [],
          escalation_routes: [
            {
              label: '999 or A&E',
              contact: '999',
              when: 'If you are not safe right now',
            },
            {
              label: 'NHS 111',
              contact: '111',
              when: 'For urgent mental-health help',
            },
            {
              label: 'Samaritans',
              contact: '116123',
              when: 'For confidential listening, any time',
            },
          ],
        })
      }
    } catch (cause) {
      setError(messageFrom(cause))
    } finally {
      setLoading(false)
    }
  }

  async function handleTimeShift(stop: keyof typeof DAY_LABELS) {
    setLoading(true)
    setError(null)
    setSafety(null)
    setCompare(null)
    try {
      setState(await timeShift(stop))
      setQuietView(false)
    } catch (cause) {
      setError(messageFrom(cause))
    } finally {
      setLoading(false)
    }
  }

  async function handleQuiet() {
    if (!state) return
    try {
      const result = await activateQuiet(12)
      setState({
        ...state,
        quiet: result.quiet,
        check_in_decision: result.check_in_decision,
      })
      setQuietView(true)
    } catch (cause) {
      setError(messageFrom(cause))
    }
  }

  async function handleResume() {
    try {
      await exitQuiet()
      setQuietView(false)
    } catch (cause) {
      setError(messageFrom(cause))
    }
  }

  async function handleMood(nextMood: Mood) {
    if (!state) return
    setState({
      ...state,
      memory: {
        ...state.memory,
        preferences: {
          ...state.memory.preferences,
          declared_mood: nextMood,
        },
      },
    })
    try {
      await setMood(nextMood)
    } catch (cause) {
      setError(messageFrom(cause))
    }
  }

  async function handleTask(taskId: string, nextState: 'DONE' | 'NOT_MINE') {
    if (!state) return
    try {
      const result = await setTaskState(taskId, nextState)
      setState({
        ...state,
        next_step: result.next_step,
        not_tonight: result.not_tonight,
      })
    } catch (cause) {
      setError(messageFrom(cause))
    }
  }

  async function handleDoNotAsk(factKey: string, display: string) {
    if (!state) return
    try {
      const memory = await addDoNotAsk(factKey, display)
      setState({ ...state, memory: memory as SessionState['memory'] })
    } catch (cause) {
      setError(messageFrom(cause))
    }
  }

  async function handleCompare() {
    const text =
      input.trim() ||
      'My mum died. Work keeps messaging me. The bank asked for documents.'
    setLoading(true)
    setError(null)
    try {
      const result = await compareStory(text)
      setCompare(result.results)
      setDemoOpen(false)
    } catch (cause) {
      setError(messageFrom(cause))
    } finally {
      setLoading(false)
    }
  }

  async function copyDraft(draft: Draft) {
    await navigator.clipboard.writeText(draft.body)
    setCopiedDraft(draft.draft_id)
    window.setTimeout(() => setCopiedDraft(null), 1600)
  }

  if (quietView) {
    return (
      <div className="app quiet-screen" data-mood={appMood}>
        <Wordmark />
        <main className="quiet-center">
          <div className="quiet-mark" aria-hidden="true" />
          <h1>I&apos;ll be here.</h1>
          <p>Nothing until tomorrow.</p>
          <button className="text-button" type="button" onClick={handleResume}>
            Write when you need to
          </button>
        </main>
        <Composer
          input={input}
          loading={loading}
          onInput={setInput}
          onSubmit={handleSubmit}
          quiet
        />
      </div>
    )
  }

  return (
    <div className="app" data-mood={appMood}>
      <header className="topbar">
        <Wordmark />
        <div className="topbar-meta">
          {state?.care_state && (
            <span className="day-label">
              Day {state.care_state.stretch_day} ·{' '}
              {state.care_state.signals.time_of_day.toLowerCase()}
            </span>
          )}
          <button
            className="control-button"
            type="button"
            onClick={() => setDemoOpen((open) => !open)}
            aria-expanded={demoOpen}
          >
            Simulator
            <Chevron open={demoOpen} />
          </button>
        </div>
      </header>

      {demoOpen && (
        <section className="demo-panel" aria-label="Demo simulator controls">
          <div>
            <span className="eyebrow">Simulator</span>
            <p>Moves the clock, not real time.</p>
          </div>
          <div className="demo-actions">
            {(Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>).map(
              (stop) => (
                <button
                  type="button"
                  className="secondary-button"
                  key={stop}
                  onClick={() => handleTimeShift(stop)}
                >
                  {DAY_LABELS[stop]}
                </button>
              ),
            )}
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleSeed('MAYA_DAY1')}
            >
              Reset Maya
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleSeed('RISKY_LEGAL_PROMPT')}
            >
              Legal test
            </button>
            <button
              type="button"
              className="secondary-button danger-subtle"
              onClick={() => handleSeed('CRISIS_SIGNAL')}
            >
              Safety test
            </button>
            <button
              type="button"
              className="primary-small"
              onClick={handleCompare}
            >
              Compare 14:00 and 03:00
            </button>
          </div>
        </section>
      )}

      <section className="mood-strip" aria-label="Presentation preference">
        <span className="mood-prompt">Today feels</span>
        <div className="mood-options">
          {MOODS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={mood === option.value ? 'mood-chip active' : 'mood-chip'}
              aria-pressed={mood === option.value}
              onClick={() => handleMood(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {compare && <Comparison results={compare} onClose={() => setCompare(null)} />}

      <main className="workspace">
        <Panel
          className="heard-panel"
          number="01"
          title="What I heard"
          subtitle="The facts you should not have to repeat."
        >
          {loading && !state ? (
            <Reading />
          ) : state?.memory.canonical_facts.length ? (
            <div className="fact-list">
              {state.memory.canonical_facts.slice(0, 6).map((fact) => (
                <div className="fact-row" key={fact.fact_id}>
                  <div>
                    <p>{fact.display}</p>
                    <span>{fact.source_type.toLowerCase()}</span>
                  </div>
                  <button
                    type="button"
                    className="icon-button"
                    title="Do not ask me this again"
                    aria-label={`Do not ask again about ${fact.display}`}
                    onClick={() => handleDoNotAsk(fact.key, fact.display)}
                  >
                    <LockIcon />
                  </button>
                </div>
              ))}
              {state.memory.do_not_ask.length > 0 && (
                <div className="memory-note">
                  <LockIcon />
                  <span>
                    {state.memory.do_not_ask.length} topic
                    {state.memory.do_not_ask.length === 1 ? '' : 's'} held quietly
                  </span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              line="Nothing yet."
              detail="Your words will become a short memory here."
            />
          )}
        </Panel>

        <Panel
          className="chosen-panel"
          number="02"
          title="What I chose"
          subtitle="The kind of help that fits this moment."
        >
          {state?.care_state ? (
            <div className="decision-stack">
              <div className="mode-row" aria-label="Selected care modes">
                {modes.map((mode) => (
                  <span className="mode-chip" key={mode}>
                    {pretty(mode)}
                  </span>
                ))}
              </div>
              <div className="rationale-list">
                {state.care_state.rationale.map((reason) => (
                  <div className="rationale-row" key={reason.signal}>
                    <span className="rationale-line" />
                    <div>
                      <p>{reason.clause}</p>
                      <span>
                        {pretty(reason.signal)} · {String(reason.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {state.care_state.degraded && (
                <div className="degraded-note">
                  Reduced mode. This was routed on time and workload only.
                </div>
              )}
              {state.check_in_decision && (
                <DecisionCard decision={state.check_in_decision} />
              )}
              <div className="confidence">
                <div>
                  <span>Routing confidence</span>
                  <strong>
                    {Math.round(state.care_state.confidence * 100)}%
                  </strong>
                </div>
                <div className="confidence-track">
                  <span
                    style={{
                      width: `${Math.round(state.care_state.confidence * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              line="No decision yet."
              detail="QuietBridge chooses after it reads your note."
            />
          )}
        </Panel>

        <Panel
          className="did-panel"
          number="03"
          title="What I did"
          subtitle="One manageable step. Everything else can wait."
        >
          {isEscalating && safety ? (
            <EscalationCard verdict={safety} />
          ) : state?.care_state ? (
            <div className="action-stack" aria-live="polite">
              {state.response_text && (
                <p className="response-copy">{state.response_text}</p>
              )}
              {state.care_state.safe_pivot && (
                <div className="safe-pivot">
                  <ShieldIcon />
                  <div>
                    <strong>Professional guidance needed</strong>
                    <p>
                      QuietBridge will not answer legal or financial questions
                      as advice.
                    </p>
                  </div>
                </div>
              )}
              {state.next_step ? (
                <ActionCard
                  task={state.next_step}
                  onDone={() => handleTask(state.next_step!.task_id, 'DONE')}
                />
              ) : (
                !state.care_state.modes.includes('ESCALATE') && (
                  <div className="enough-note">That is enough for now.</div>
                )
              )}
              {state.drafts.map((draft) => (
                <DraftCard
                  key={draft.draft_id}
                  draft={draft}
                  copied={copiedDraft === draft.draft_id}
                  onCopy={() => copyDraft(draft)}
                />
              ))}
              {state.care_state.delivery.queue_visibility !== 'hidden' &&
                state.not_tonight.length > 0 && (
                  <div className="queue">
                    <button
                      className="queue-toggle"
                      type="button"
                      onClick={() => setQueueOpen((open) => !open)}
                      aria-expanded={queueOpen}
                    >
                      <span>Everything else · waiting</span>
                      <Chevron open={queueOpen} />
                    </button>
                    {queueOpen && (
                      <div className="queue-list">
                        {state.not_tonight.map((task) => (
                          <div className="queue-item" key={task.task_id}>
                            <span>{task.title}</span>
                            <button
                              type="button"
                              onClick={() => handleTask(task.task_id, 'NOT_MINE')}
                            >
                              Not mine
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              <button
                className="quiet-button"
                type="button"
                onClick={handleQuiet}
              >
                <QuietIcon />
                I can stay quiet now.
              </button>
            </div>
          ) : (
            <EmptyState
              line="Tell me what is happening."
              detail="One note is enough."
            />
          )}
        </Panel>
      </main>

      <Composer
        input={input}
        loading={loading}
        onInput={setInput}
        onSubmit={handleSubmit}
      />

      <footer>
        <span>Demo · synthetic data only</span>
        <span>Voice off · text remains complete</span>
      </footer>
    </div>
  )
}

function Wordmark() {
  return (
    <div className="wordmark" aria-label="QuietBridge">
      <span className="bridge-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>QuietBridge</span>
    </div>
  )
}

function Panel({
  number,
  title,
  subtitle,
  className,
  children,
}: {
  number: string
  title: string
  subtitle: string
  className: string
  children: React.ReactNode
}) {
  return (
    <section className={`panel ${className}`} aria-label={title}>
      <header className="panel-header">
        <span>{number}</span>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  )
}

function Composer({
  input,
  loading,
  onInput,
  onSubmit,
  quiet = false,
}: {
  input: string
  loading: boolean
  onInput: (value: string) => void
  onSubmit: (event: FormEvent) => void
  quiet?: boolean
}) {
  return (
    <div className={quiet ? 'composer-wrap quiet-composer' : 'composer-wrap'}>
      <form className="composer" onSubmit={onSubmit}>
        <label htmlFor="quietbridge-note" className="sr-only">
          Write what is happening
        </label>
        <textarea
          id="quietbridge-note"
          value={input}
          maxLength={4000}
          rows={1}
          onChange={(event) => onInput(event.target.value)}
          placeholder={quiet ? 'Write when you need to…' : 'Write what is happening. Short is fine…'}
        />
        <div className="composer-meta">
          {input.length >= 3500 && <span>{input.length} / 4000</span>}
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || loading}
            aria-label="Send note"
          >
            {loading ? <LoadingMark /> : <ArrowIcon />}
          </button>
        </div>
      </form>
      {!quiet && (
        <p className="composer-hint">
          No categories to choose. No need to make it tidy.
        </p>
      )}
    </div>
  )
}

function ActionCard({ task, onDone }: { task: Task; onDone: () => void }) {
  return (
    <div className="action-card">
      <span className="eyebrow">One next step</span>
      <h3>{task.first_step}</h3>
      <div className="action-meta">
        <span>About {task.effort_minutes_estimate} minutes</span>
        <button type="button" className="done-button" onClick={onDone}>
          Mark done
        </button>
      </div>
    </div>
  )
}

function DraftCard({
  draft,
  copied,
  onCopy,
}: {
  draft: Draft
  copied: boolean
  onCopy: () => void
}) {
  return (
    <article className="draft-card">
      <header>
        <span className="eyebrow">{pretty(draft.kind)}</span>
        <button type="button" onClick={onCopy}>
          <CopyIcon />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </header>
      <p>{draft.body}</p>
    </article>
  )
}

function DecisionCard({ decision }: { decision: CheckInDecision }) {
  const quiet = decision.decision === 'STAY_QUIET'
  return (
    <div className={quiet ? 'decision-card quiet' : 'decision-card'}>
      <div className="decision-symbol" aria-hidden="true">
        {quiet ? <QuietIcon /> : <ArrowIcon />}
      </div>
      <div>
        <span>{quiet ? 'Stay quiet' : 'Check in'}</span>
        <p>{decision.reasons[0]?.detail}</p>
      </div>
    </div>
  )
}

function EscalationCard({ verdict }: { verdict: SafetyVerdict }) {
  return (
    <div className="escalation-card" aria-live="assertive">
      <ShieldIcon />
      <span className="eyebrow">Immediate human support</span>
      <h3>You do not need to hold this alone.</h3>
      <p>Use the route that fits what is happening now.</p>
      <div className="escalation-routes">
        {verdict.escalation_routes.map((route) => (
          <a key={route.contact} href={`tel:${route.contact}`}>
            <div>
              <strong>{route.label}</strong>
              <span>{route.when}</span>
            </div>
            <ArrowIcon />
          </a>
        ))}
      </div>
    </div>
  )
}

function Comparison({
  results,
  onClose,
}: {
  results: Awaited<ReturnType<typeof compareStory>>['results']
  onClose: () => void
}) {
  return (
    <section className="comparison" aria-label="Same story at two times">
      <header>
        <div>
          <span className="eyebrow">Same story · different context</span>
          <h2>The hour changes how much help arrives.</h2>
        </div>
        <button type="button" className="icon-button" onClick={onClose}>
          <CloseIcon />
          <span className="sr-only">Close comparison</span>
        </button>
      </header>
      <div className="comparison-grid">
        {results.map((result) => (
          <article key={result.sim_now}>
            <span className="comparison-time">
              {new Date(result.sim_now).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/London',
              })}
            </span>
            <div className="mode-row">
              {result.care_state.modes.map((mode) => (
                <span className="mode-chip" key={mode}>
                  {pretty(mode)}
                </span>
              ))}
            </div>
            <p>{result.response_text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function EmptyState({ line, detail }: { line: string; detail: string }) {
  return (
    <div className="empty-state">
      <span className="empty-line" />
      <p>{line}</p>
      <span>{detail}</span>
    </div>
  )
}

function Reading() {
  return (
    <div className="reading">
      <LoadingMark />
      <span>Reading.</span>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={open ? 'chevron open' : 'chevron'} viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="5.5" y="9" width="9" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7.5 9V7a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="7" y="7" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 12H4.5A1.5 1.5 0 0 1 3 10.5v-6A1.5 1.5 0 0 1 4.5 3h6A1.5 1.5 0 0 1 12 4.5V5" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  )
}

function QuietIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5 10h10M7 7.5h6M7 12.5h6" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.8 16 5v4.4c0 3.5-2.2 6.3-6 7.8-3.8-1.5-6-4.3-6-7.8V5l6-2.2Z" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7.2 10 9 11.8l3.8-4" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m6 6 8 8M14 6l-8 8" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function LoadingMark() {
  return (
    <span className="loading-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

function mergeTurn(current: SessionState, turn: TurnResponse): SessionState {
  return {
    ...current,
    session: {
      ...current.session,
      sim_now: turn.care_state.sim_now,
      stretch: {
        ...current.session.stretch,
        current_day: turn.care_state.stretch_day,
      },
    },
    memory: turn.memory,
    care_state: turn.care_state,
    next_step: turn.next_step,
    not_tonight: turn.not_tonight,
    drafts: turn.drafts,
    check_in_decision: turn.check_in_decision,
    response_text: turn.response.text,
  }
}

function pretty(value: string): string {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function messageFrom(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : 'That did not go through. Your note is still here.'
}

export default App
