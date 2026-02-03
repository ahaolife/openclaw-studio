import { describe, expect, it } from "vitest";

import {
  buildAgentMainSessionKey,
  parseAgentIdFromSessionKey,
} from "@/lib/gateway/sessionKeys";

describe("sessionKey helpers", () => {
  it("buildAgentMainSessionKey formats agent session key", () => {
    expect(buildAgentMainSessionKey("agent-1", "main")).toBe("agent:agent-1:main");
  });

  it("parseAgentIdFromSessionKey extracts agent id", () => {
    expect(parseAgentIdFromSessionKey("agent:agent-1:main")).toBe("agent-1");
  });

  it("parseAgentIdFromSessionKey returns null when missing", () => {
    expect(parseAgentIdFromSessionKey("")).toBeNull();
  });
});
