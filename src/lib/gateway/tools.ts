export type GatewayToolInvokePayload = {
  tool: string;
  sessionKey?: string;
  action?: string;
  args?: Record<string, unknown>;
  dryRun?: boolean;
};

export type GatewayToolInvokeResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string };

export const invokeGatewayTool = async (
  payload: GatewayToolInvokePayload
): Promise<GatewayToolInvokeResult> => {
  const res = await fetch("/api/gateway/tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    const error =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `Request failed with status ${res.status}.`;
    return { ok: false, error };
  }
  if (!data || typeof data !== "object" || !("ok" in data)) {
    return { ok: false, error: "Invalid gateway tool response." };
  }
  return data as GatewayToolInvokeResult;
};
