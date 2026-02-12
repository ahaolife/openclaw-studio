import type { AgentGuidedSetup } from "@/features/agents/operations/createAgentOperation";

export const PENDING_GUIDED_SETUP_SESSION_KEY = "openclaw.studio.pending-guided-setups.v1";
export const PENDING_GUIDED_SETUP_STORE_VERSION = 1;
export const PENDING_GUIDED_SETUP_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type SerializedPendingGuidedSetupEntry = {
  agentId: string;
  setup: AgentGuidedSetup;
  savedAtMs: number;
};

type SerializedPendingGuidedSetupStore = {
  version: 1;
  entries: SerializedPendingGuidedSetupEntry[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const asFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const parseAgentId = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isGuidedSetup = (value: unknown): value is AgentGuidedSetup => {
  if (!isRecord(value)) return false;
  if (!isRecord(value.agentOverrides)) return false;
  if (!isRecord(value.files)) return false;
  const execApprovals = value.execApprovals;
  if (execApprovals !== null && execApprovals !== undefined && !isRecord(execApprovals)) {
    return false;
  }
  return true;
};

const parseStore = (raw: string, params: { nowMs: number; maxAgeMs: number }) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return {} as Record<string, AgentGuidedSetup>;
  }
  if (!isRecord(parsed) || parsed.version !== PENDING_GUIDED_SETUP_STORE_VERSION) {
    return {} as Record<string, AgentGuidedSetup>;
  }
  const entriesRaw = Array.isArray(parsed.entries) ? parsed.entries : [];
  const next: Record<string, AgentGuidedSetup> = {};
  for (const entry of entriesRaw) {
    if (!isRecord(entry)) continue;
    const agentId = parseAgentId(entry.agentId);
    const savedAtMs = asFiniteNumber(entry.savedAtMs);
    if (!agentId || savedAtMs === null || savedAtMs < params.nowMs - params.maxAgeMs) continue;
    if (!isGuidedSetup(entry.setup)) continue;
    next[agentId] = entry.setup;
  }
  return next;
};

export const loadPendingGuidedSetupsFromStorage = (params: {
  storage: Storage | null | undefined;
  nowMs?: number;
  maxAgeMs?: number;
}): Record<string, AgentGuidedSetup> => {
  if (!params.storage) return {};
  const raw = params.storage.getItem(PENDING_GUIDED_SETUP_SESSION_KEY);
  if (!raw) return {};
  return parseStore(raw, {
    nowMs: params.nowMs ?? Date.now(),
    maxAgeMs: params.maxAgeMs ?? PENDING_GUIDED_SETUP_MAX_AGE_MS,
  });
};

export const persistPendingGuidedSetupsToStorage = (params: {
  storage: Storage | null | undefined;
  setupsByAgentId: Record<string, AgentGuidedSetup>;
  nowMs?: number;
}): void => {
  if (!params.storage) return;
  const entries: SerializedPendingGuidedSetupEntry[] = Object.entries(params.setupsByAgentId)
    .map(([agentId, setup]) => ({ agentId: agentId.trim(), setup, savedAtMs: params.nowMs ?? Date.now() }))
    .filter((entry) => entry.agentId.length > 0);
  if (entries.length === 0) {
    params.storage.removeItem(PENDING_GUIDED_SETUP_SESSION_KEY);
    return;
  }
  const payload: SerializedPendingGuidedSetupStore = {
    version: PENDING_GUIDED_SETUP_STORE_VERSION,
    entries,
  };
  params.storage.setItem(PENDING_GUIDED_SETUP_SESSION_KEY, JSON.stringify(payload));
};
