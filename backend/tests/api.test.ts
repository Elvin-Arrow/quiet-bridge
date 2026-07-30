import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { MemorySessionStore } from "../src/store.js";

describe("QuietBridge backend", () => {
  let app: FastifyInstance;
  let sessionId: string;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.DEMO_OFFLINE = "true";
    delete process.env.DEMO_KEY;
    sessionId = randomUUID();
    app = await buildApp(new MemorySessionStore());
  });

  afterEach(async () => {
    await app.close();
  });

  it("creates and rehydrates a session", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/v1/session",
      payload: { session_id: sessionId, timezone: "Europe/London", locale: "en-GB" },
    });
    assert.equal(create.statusCode, 200);
    assert.equal(create.json().session.session_id, sessionId);

    const state = await app.inject({
      method: "GET",
      url: `/v1/session/${sessionId}/state`,
    });
    assert.equal(state.statusCode, 200);
    assert.equal(state.json().memory.preferences.max_actions, 1);
  });

  it("routes the Maya 3AM story to ORGANISE + QUIET with one step", async () => {
    const response = await ingest(
      "My mum died last night. Work keeps messaging me. The bank asked for documents. I haven't slept. Please don't make me do ten things.",
      "maya-1",
    );
    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.deepEqual(body.care_state.modes, ["ORGANISE", "QUIET"]);
    assert.equal(body.care_state.delivery.max_actions, 1);
    assert.equal(body.care_state.delivery.queue_visibility, "hidden");
    assert.equal(body.next_step.first_step, "Send this two-line message to work");
    assert.equal(body.not_tonight.length, 1);
    assert.equal(body.drafts[0].kind, "WORK_MESSAGE");
    assert.equal(body.check_in_decision.decision, "STAY_QUIET");
    assert.equal(body.check_in_decision.delivery_state, "SUPPRESSED");
  });

  it("replays idempotent ingest without creating a second turn", async () => {
    const first = await ingest("Work keeps messaging me and I have not slept.", "same-key");
    const replay = await ingest("This changed but should not run.", "same-key");
    assert.equal(replay.headers["idempotency-replayed"], "true");
    assert.equal(replay.json().turn_id, first.json().turn_id);
  });

  it("safe-pivots legal or financial requests", async () => {
    const response = await ingest(
      "Can I just move the money from her account?",
      "legal-1",
      "2026-07-30T14:00:00.000+01:00",
    );
    const body = response.json();
    assert.equal(body.safety_verdict.action, "SAFE_PIVOT");
    assert.equal(body.care_state.safe_pivot, true);
    assert.ok(body.response.text.includes("cannot give legal or financial advice"));
    assert.equal(body.drafts[0].kind, "PROFESSIONAL_QUESTION");
  });

  it("lets crisis escalation override tasks and drafts", async () => {
    const response = await ingest(
      "I am not safe right now and I want to kill myself.",
      "crisis-1",
    );
    const body = response.json();
    assert.deepEqual(body.care_state.modes, ["ESCALATE"]);
    assert.equal(body.next_step, null);
    assert.deepEqual(body.drafts, []);
    assert.equal(body.safety_verdict.escalation_routes.length, 3);
  });

  it("seeds and time-shifts the Stretch through Day 4 and Day 14", async () => {
    const seeded = await app.inject({
      method: "POST",
      url: "/v1/demo/seed",
      headers: { "x-session-id": sessionId },
      payload: { scenario: "MAYA_DAY1" },
    });
    assert.equal(seeded.statusCode, 200);

    const day4 = await app.inject({
      method: "POST",
      url: "/v1/demo/time-shift",
      headers: { "x-session-id": sessionId },
      payload: { stop: "DAY_4" },
    });
    assert.equal(day4.json().session.stretch.current_day, 4);
    assert.equal(day4.json().check_in_decision.decision, "CHECK_IN");
    assert.ok(day4.json().check_in_decision.surfaced_task_id);

    const day14 = await app.inject({
      method: "POST",
      url: "/v1/demo/time-shift",
      headers: { "x-session-id": sessionId },
      payload: { stop: "DAY_14" },
    });
    assert.equal(day14.json().session.stretch.current_day, 14);
    assert.deepEqual(day14.json().care_state.modes, ["SOFTEN"]);
    assert.equal(day14.json().next_step, null);
    assert.ok(day14.json().response_text.includes("stay a while"));
  });

  it("shows the same story routing differently at 14:00 and 03:00", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/demo/compare",
      headers: { "x-session-id": sessionId },
      payload: {
        text: "Work keeps messaging me. The bank asked for documents.",
        clocks: [
          "2026-07-30T14:00:00.000+01:00",
          "2026-07-30T03:00:00.000+01:00",
        ],
      },
    });
    assert.equal(response.statusCode, 200);
    const [afternoon, night] = response.json().results;
    assert.ok(afternoon.care_state.modes.includes("ORGANISE"));
    assert.ok(!afternoon.care_state.modes.includes("QUIET"));
    assert.ok(night.care_state.modes.includes("QUIET"));
  });

  it("activates and exits quiet mode", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/session",
      payload: { session_id: sessionId },
    });
    const quiet = await app.inject({
      method: "POST",
      url: "/v1/quiet",
      headers: { "x-session-id": sessionId },
      payload: { hours: 12 },
    });
    assert.equal(quiet.json().quiet.active, true);
    assert.equal(quiet.json().check_in_decision.reasons[0].code, "SUPPRESSION_ACTIVE");

    const exit = await app.inject({
      method: "DELETE",
      url: "/v1/quiet",
      headers: { "x-session-id": sessionId },
    });
    assert.equal(exit.statusCode, 204);
  });

  async function ingest(
    text: string,
    idempotencyKey: string,
    simNow = "2026-07-30T03:00:00.000+01:00",
  ) {
    return app.inject({
      method: "POST",
      url: "/v1/ingest",
      headers: {
        "x-session-id": sessionId,
        "idempotency-key": idempotencyKey,
      },
      payload: { text, sim_now: simNow },
    });
  }
});
