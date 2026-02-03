import { describe, expect, it } from "vitest";

import {
  agentCanvasReducer,
  initialAgentCanvasState,
  type AgentSeed,
} from "@/features/canvas/state/store";
import { MIN_TILE_SIZE } from "@/lib/canvasTileDefaults";

describe("agent canvas store", () => {
  it("hydrates agent tiles with defaults and selection", () => {
    const seed: AgentSeed = {
      agentId: "agent-1",
      name: "Agent One",
      sessionKey: "agent:agent-1:main",
      position: { x: 10, y: 20 },
      size: { width: 120, height: 80 },
    };
    const next = agentCanvasReducer(initialAgentCanvasState, {
      type: "hydrateAgents",
      agents: [seed],
    });
    expect(next.loading).toBe(false);
    expect(next.selectedAgentId).toBe("agent-1");
    expect(next.agents).toHaveLength(1);
    expect(next.agents[0].status).toBe("idle");
    expect(next.agents[0].outputLines).toEqual([]);
    expect(next.agents[0].size.width).toBeGreaterThanOrEqual(MIN_TILE_SIZE.width);
    expect(next.agents[0].size.height).toBeGreaterThanOrEqual(MIN_TILE_SIZE.height);
  });

  it("clamps tile size updates", () => {
    const seed: AgentSeed = {
      agentId: "agent-1",
      name: "Agent One",
      sessionKey: "agent:agent-1:main",
      position: { x: 0, y: 0 },
      size: { width: MIN_TILE_SIZE.width, height: MIN_TILE_SIZE.height },
    };
    const hydrated = agentCanvasReducer(initialAgentCanvasState, {
      type: "hydrateAgents",
      agents: [seed],
    });
    const next = agentCanvasReducer(hydrated, {
      type: "updateAgent",
      agentId: "agent-1",
      patch: { size: { width: 10, height: 10 } },
    });
    expect(next.agents[0].size.width).toBeGreaterThanOrEqual(MIN_TILE_SIZE.width);
    expect(next.agents[0].size.height).toBeGreaterThanOrEqual(MIN_TILE_SIZE.height);
  });
});
