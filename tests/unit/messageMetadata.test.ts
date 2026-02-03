import { describe, expect, it } from "vitest";

import {
  buildAgentInstruction,
  isUiMetadataPrefix,
  stripUiMetadata,
} from "@/lib/text/message-metadata";

describe("message-metadata", () => {
  it("returns plain messages without metadata", () => {
    const built = buildAgentInstruction({
      message: "hello",
    });

    expect(isUiMetadataPrefix(built)).toBe(false);
    expect(stripUiMetadata(built)).toBe("hello");
  });
});
