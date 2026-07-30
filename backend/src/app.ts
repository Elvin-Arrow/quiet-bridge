import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import { z } from "zod";
import {
  activateQuiet,
  decideCareState,
  evaluateCheckIn,
  exitQuiet,
  extractDeterministicSignals,
  processTurn,
  publicState,
  seedScenario,
  setTaskState,
  type Mood,
  type Scenario,
  type SessionState,
  type Task,
} from "./domain.js";
import { extractSignalScores } from "./openai-signals.js";
import { MemorySessionStore } from "./store.js";

const SessionBody = z.object({
  session_id: z.string().uuid().nullable().optional(),
  timezone: z.literal("Europe/London").default("Europe/London"),
  locale: z.literal("en-GB").default("en-GB"),
});

const IngestBody = z.object({
  text: z.string().min(1).max(4_000),
  sim_now: z.string().datetime({ offset: true }).optional(),
  client_local_time: z.string().datetime({ offset: true }).optional(),
  declared_mood: z
    .enum(["NUMB", "ANXIOUS", "OVERWHELMED", "SAD", "UNDECLARED"])
    .optional(),
});

const ScenarioBody = z.object({
  scenario: z.enum([
    "MAYA_DAY1",
    "ADMIN_FATIGUE_DAY4",
    "ISOLATION_DAY14",
    "RISKY_LEGAL_PROMPT",
    "CRISIS_SIGNAL",
  ]),
});

const TimeShiftBody = z.union([
  z.object({ stop: z.enum(["DAY_1", "DAY_4", "DAY_14"]) }),
  z.object({ sim_now: z.string().datetime({ offset: true }) }),
]);

export async function buildApp(
  store = new MemorySessionStore(),
): Promise<FastifyInstance> {
  const app = Fastify({ logger: process.env.NODE_ENV !== "test" });
  const idempotency = new Map<string, { expiresAt: number; body: unknown }>();

  await app.register(cors, {
    origin: process.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim()) ?? true,
    allowedHeaders: ["Content-Type", "X-Session-Id", "Idempotency-Key", "X-Demo-Key"],
    exposedHeaders: ["Idempotency-Replayed"],
  });

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    const message = error instanceof Error ? error.message : "Unknown request error";
    const statusCode = message === "TASK_NOT_FOUND" ? 404 : message === "TASK_TERMINAL" ? 409 : 400;
    return sendError(reply, statusCode, "VALIDATION_FAILED", message, false);
  });

  app.get("/health", async () => ({
    status: "ok",
    service: "quietbridge-backend",
    voice_mode: "off",
    llm_enabled: Boolean(process.env.OPENAI_API_KEY) && process.env.DEMO_OFFLINE !== "true",
  }));

  app.post("/v1/session", async (request, reply) => {
    const body = SessionBody.parse(request.body ?? {});
    const state = body.session_id
      ? store.getOrCreate(body.session_id)
      : store.create();
    return reply.code(body.session_id ? 200 : 201).send({
      session: state.session,
      memory: state.memory,
    });
  });

  app.get("/v1/session/:sessionId/state", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    const state = store.get(sessionId);
    if (!state) return sendError(reply, 404, "SESSION_NOT_FOUND", "Session not found.", false);
    return publicState(state);
  });

  app.post("/v1/ingest", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const body = IngestBody.parse(request.body);
    const state = store.getOrCreate(sessionId);
    const key = request.headers["idempotency-key"]?.toString();
    if (key) {
      const cached = idempotency.get(`${sessionId}:${key}`);
      if (cached && cached.expiresAt > Date.now()) {
        reply.header("Idempotency-Replayed", "true");
        return cached.body;
      }
    }

    if (state.quiet.active) exitQuiet(state);
    if (body.declared_mood) {
      state.memory.preferences.declared_mood = body.declared_mood as Mood;
    }
    const simNow = body.sim_now ?? state.session.sim_now ?? new Date().toISOString();
    const extraction = await extractSignalScores(body.text);
    const result = processTurn(
      state,
      body.text,
      simNow,
      extraction.scores,
      extraction.model,
    );
    if (key) {
      idempotency.set(`${sessionId}:${key}`, {
        expiresAt: Date.now() + 10 * 60_000,
        body: result,
      });
    }
    return reply.code(result.care_state.degraded ? 202 : 200).send(result);
  });

  app.post("/v1/quiet", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const body = z.object({ hours: z.union([z.literal(12), z.literal(24), z.null()]).default(12) }).parse(request.body);
    const state = store.getOrCreate(sessionId);
    const decision = activateQuiet(state, state.session.sim_now, body.hours);
    state.check_in_decision = decision;
    return {
      suppression_window: decision.suppression_window,
      check_in_decision: decision,
      quiet: state.quiet,
    };
  });

  app.delete("/v1/quiet", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const state = store.getOrCreate(sessionId);
    exitQuiet(state);
    return reply.code(204).send();
  });

  app.get("/v1/check-in", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const query = z.object({ sim_now: z.string().datetime({ offset: true }).optional() }).parse(request.query);
    const state = store.getOrCreate(sessionId);
    const simNow = query.sim_now ?? state.session.sim_now;
    state.session.sim_now = simNow;
    const decision = evaluateCheckIn(state, simNow);
    state.check_in_decision = decision;
    return {
      ...decision,
      surfaced_task:
        state.tasks.find((task) => task.task_id === decision.surfaced_task_id) ?? null,
      message:
        decision.stretch_day === 14
          ? "I am here. You can stay a while, or choose quiet."
          : decision.decision === "CHECK_IN"
            ? "One thing is ready when you are."
            : null,
    };
  });

  app.patch("/v1/tasks/:taskId", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const { taskId } = request.params as { taskId: string };
    const body = z.object({
      state: z.enum(["NEXT_STEP", "NOT_TONIGHT", "DONE", "NOT_MINE"]),
    }).parse(request.body);
    const state = store.getOrCreate(sessionId);
    const task = setTaskState(state, taskId, body.state as Task["state"], state.session.sim_now);
    return {
      task,
      next_step: state.tasks.find((candidate) => candidate.state === "NEXT_STEP") ?? null,
      not_tonight: state.tasks.filter((candidate) => candidate.state === "NOT_TONIGHT"),
    };
  });

  app.post("/v1/memory/do-not-ask", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const body = z.object({
      fact_key: z.string().nullable().default(null),
      topic: z.string().min(1).max(80),
    }).parse(request.body);
    const state = store.getOrCreate(sessionId);
    state.memory.do_not_ask.push({
      id: randomUUID(),
      topic: body.topic,
      fact_key: body.fact_key,
      created_at: new Date().toISOString(),
      origin: "USER_EXPLICIT",
    });
    return reply.code(201).send(state.memory);
  });

  app.patch("/v1/memory/preferences", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const body = z.object({
      no_phone_calls: z.boolean().optional(),
      quiet_preferred: z.boolean().optional(),
      voice_enabled: z.boolean().optional(),
      declared_mood: z.enum(["NUMB", "ANXIOUS", "OVERWHELMED", "SAD", "UNDECLARED"]).optional(),
    }).parse(request.body);
    const state = store.getOrCreate(sessionId);
    Object.assign(state.memory.preferences, body);
    state.memory.updated_at = new Date().toISOString();
    return state.memory;
  });

  app.get("/v1/events", async (request, reply) => {
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) }).parse(request.query);
    const state = store.getOrCreate(sessionId);
    return { events: state.events.slice(-query.limit), next_cursor: null };
  });

  app.post("/v1/demo/seed", async (request, reply) => {
    if (!requireDemoKey(request, reply)) return;
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const { scenario } = ScenarioBody.parse(request.body);
    const state = store.getOrCreate(sessionId);
    seedScenario(state, scenario as Scenario);
    return publicState(state);
  });

  app.post("/v1/demo/time-shift", async (request, reply) => {
    if (!requireDemoKey(request, reply)) return;
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const body = TimeShiftBody.parse(request.body);
    const state = store.getOrCreate(sessionId);
    const simNow =
      "sim_now" in body
        ? body.sim_now
        : {
            DAY_1: "2026-07-30T03:00:00.000+01:00",
            DAY_4: "2026-08-02T11:00:00.000+01:00",
            DAY_14: "2026-08-12T20:00:00.000+01:00",
          }[body.stop];
    applyTimeShift(state, simNow);
    return publicState(state);
  });

  app.post("/v1/demo/compare", async (request, reply) => {
    if (!requireDemoKey(request, reply)) return;
    const sessionId = requireSessionId(request, reply);
    if (!sessionId) return;
    const body = z.object({
      text: z.string().min(1).optional(),
      clocks: z.array(z.string().datetime({ offset: true })).length(2).default([
        "2026-07-30T14:00:00.000+01:00",
        "2026-07-30T03:00:00.000+01:00",
      ]),
    }).parse(request.body ?? {});
    const state = store.getOrCreate(sessionId);
    const text = body.text ?? state.last_input ?? "Work keeps messaging me. I have not slept.";
    const results = body.clocks.map((clock) => {
      const signals = extractDeterministicSignals(text, clock, state.tasks.length);
      const careState = decideCareState(state, randomUUID(), signals, clock);
      return {
        sim_now: clock,
        care_state: careState,
        response_text: careState.modes.includes("QUIET")
          ? "Nothing else is needed now. I can stay quiet."
          : "I reduced this to one next step. Everything else is waiting.",
        next_step: state.tasks.find((task) => task.state === "NEXT_STEP") ?? null,
      };
    });
    return { results };
  });

  app.post("/v1/session/:sessionId/reset", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    store.reset(sessionId);
    return reply.code(204).send();
  });

  app.delete("/v1/session/:sessionId", async (request, reply) => {
    const { sessionId } = request.params as { sessionId: string };
    store.delete(sessionId);
    return reply.code(204).send();
  });

  return app;
}

function applyTimeShift(state: SessionState, simNow: string): void {
  state.session.sim_now = simNow;
  const day = Math.max(
    1,
    Math.min(
      14,
      Math.floor(
        (new Date(simNow).getTime() - new Date(state.session.stretch.started_at).getTime()) /
          86_400_000,
      ) + 1,
    ),
  );
  state.session.stretch.current_day = day;
  if (day >= 4) {
    exitQuiet(state);
    for (const task of state.tasks) {
      if (task.state === "NOT_TONIGHT") task.surface_after = simNow;
    }
  }
  if (day === 14) {
    for (const task of state.tasks) {
      task.state = "DONE";
      task.state_changed_at = simNow;
    }
  }
  const signals = extractDeterministicSignals(
    day === 14 ? "I am here after my mother's death." : state.last_input ?? "Work needs a reply.",
    simNow,
    state.tasks.filter((task) => task.state === "NOT_TONIGHT").length,
  );
  const adjusted =
    day === 14
      ? { ...signals, admin_density: 0, grief_level: 80, energy_score: 55, question_tolerance: 55 }
      : day === 4
        ? { ...signals, fatigue_level: 60, energy_score: 55, question_tolerance: 55 }
        : signals;
  state.care_state = decideCareState(state, randomUUID(), adjusted, simNow);
  state.response_text =
    day === 14
      ? "I am here. You can stay a while, or choose quiet."
      : state.response_text;
  state.check_in_decision = evaluateCheckIn(state, simNow);
}

function requireSessionId(
  request: FastifyRequest,
  reply: FastifyReply,
): string | undefined {
  const sessionId = request.headers["x-session-id"]?.toString();
  if (!sessionId || !z.string().uuid().safeParse(sessionId).success) {
    sendError(reply, 400, "VALIDATION_FAILED", "A valid X-Session-Id header is required.", false);
    return undefined;
  }
  return sessionId;
}

function requireDemoKey(request: FastifyRequest, reply: FastifyReply): boolean {
  const expected = process.env.DEMO_KEY;
  if (!expected) return true;
  if (request.headers["x-demo-key"] !== expected) {
    sendError(reply, 403, "DEMO_KEY_INVALID", "The demo key is invalid.", false);
    return false;
  }
  return true;
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  retryable: boolean,
) {
  return reply.code(statusCode).send({
    error: {
      code,
      message,
      user_message:
        statusCode >= 500
          ? "That did not go through. Your note is saved. Try again."
          : message,
      turn_id: null,
      retryable,
      details: {},
    },
  });
}
