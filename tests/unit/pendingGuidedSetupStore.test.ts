import { describe, expect, it } from "vitest";
import type { AgentGuidedSetup } from "@/features/agents/operations/createAgentOperation";
import {
  loadPendingGuidedSetupsFromStorage,
  PENDING_GUIDED_SETUP_MAX_AGE_MS,
  PENDING_GUIDED_SETUP_SESSION_KEY,
  persistPendingGuidedSetupsToStorage,
} from "@/features/agents/creation/pendingSetupStore";

class MemoryStorage implements Storage {
  private readonly map = new Map<string, string>();

  get length() {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
}

const createSetup = (): AgentGuidedSetup => ({
  agentOverrides: {
    sandbox: { mode: "non-main", workspaceAccess: "ro" },
    tools: { profile: "coding", alsoAllow: ["group:runtime"], deny: ["group:web"] },
  },
  files: {
    "AGENTS.md": "# Mission",
  },
  execApprovals: {
    security: "allowlist",
    ask: "always",
    allowlist: [{ pattern: "/usr/bin/git" }],
  },
});

describe("pendingGuidedSetupStore", () => {
  it("persists and loads pending setups by agent id", () => {
    const storage = new MemoryStorage();
    const setup = createSetup();
    persistPendingGuidedSetupsToStorage({
      storage,
      setupsByAgentId: { "agent-1": setup },
      nowMs: 2_000,
    });

    const loaded = loadPendingGuidedSetupsFromStorage({
      storage,
      nowMs: 2_500,
    });

    expect(loaded).toEqual({ "agent-1": setup });
  });

  it("ignores malformed JSON and unknown shapes", () => {
    const storage = new MemoryStorage();
    storage.setItem(PENDING_GUIDED_SETUP_SESSION_KEY, "not-json");
    expect(loadPendingGuidedSetupsFromStorage({ storage })).toEqual({});

    storage.setItem(
      PENDING_GUIDED_SETUP_SESSION_KEY,
      JSON.stringify({ version: 1, entries: [{ agentId: "", setup: {}, savedAtMs: 1_000 }] })
    );
    expect(loadPendingGuidedSetupsFromStorage({ storage, nowMs: 2_000 })).toEqual({});
  });

  it("drops stale entries using max age", () => {
    const storage = new MemoryStorage();
    const setup = createSetup();
    storage.setItem(
      PENDING_GUIDED_SETUP_SESSION_KEY,
      JSON.stringify({
        version: 1,
        entries: [{ agentId: "agent-1", setup, savedAtMs: 1_000 }],
      })
    );

    const loaded = loadPendingGuidedSetupsFromStorage({
      storage,
      nowMs: 1_000 + PENDING_GUIDED_SETUP_MAX_AGE_MS + 1,
    });

    expect(loaded).toEqual({});
  });

  it("removes storage key when no pending setups remain", () => {
    const storage = new MemoryStorage();
    storage.setItem(PENDING_GUIDED_SETUP_SESSION_KEY, "{}");

    persistPendingGuidedSetupsToStorage({
      storage,
      setupsByAgentId: {},
    });

    expect(storage.getItem(PENDING_GUIDED_SETUP_SESSION_KEY)).toBeNull();
  });
});
