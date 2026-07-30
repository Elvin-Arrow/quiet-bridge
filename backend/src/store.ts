import { createEmptyState, type SessionState } from "./domain.js";

export class MemorySessionStore {
  private readonly sessions = new Map<string, SessionState>();

  create(sessionId?: string, now?: string): SessionState {
    const state = createEmptyState(sessionId, now);
    this.sessions.set(state.session.session_id, state);
    return state;
  }

  get(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  getOrCreate(sessionId: string, now?: string): SessionState {
    return this.get(sessionId) ?? this.create(sessionId, now);
  }

  reset(sessionId: string): SessionState {
    const existing = this.get(sessionId);
    const createdAt = existing?.session.created_at;
    const state = createEmptyState(sessionId, createdAt);
    this.sessions.set(sessionId, state);
    return state;
  }

  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  clear(): void {
    this.sessions.clear();
  }
}
