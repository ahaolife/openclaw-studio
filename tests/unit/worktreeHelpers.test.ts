import { describe, expect, it } from "vitest";

import { buildAgentInstruction } from "@/lib/text/message-metadata";

describe("buildAgentInstruction", () => {
  it("returns plain message text", () => {
    const message = buildAgentInstruction({
      message: "Ship it",
    });

    expect(message).toBe("Ship it");
  });
});
