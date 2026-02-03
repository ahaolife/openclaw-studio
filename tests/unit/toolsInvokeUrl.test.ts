import { describe, expect, it } from "vitest";

import { toGatewayHttpUrl } from "@/lib/gateway/url";

describe("toGatewayHttpUrl", () => {
  it("converts wss to https", () => {
    expect(toGatewayHttpUrl("wss://example.com")).toBe("https://example.com");
  });

  it("converts ws to http", () => {
    expect(toGatewayHttpUrl("ws://127.0.0.1:18789")).toBe("http://127.0.0.1:18789");
  });

  it("passes through http urls", () => {
    expect(toGatewayHttpUrl("http://localhost:18789")).toBe("http://localhost:18789");
  });
});
