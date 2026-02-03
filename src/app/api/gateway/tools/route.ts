import { NextResponse } from "next/server";

import { toGatewayHttpUrl } from "@/lib/gateway/url";
import { logger } from "@/lib/logger";
import { loadStudioSettings } from "@/lib/studio/settings.server";

export const runtime = "nodejs";

type ToolsInvokePayload = {
  tool?: unknown;
  action?: unknown;
  args?: unknown;
  sessionKey?: unknown;
  dryRun?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object" && !Array.isArray(value));

const coerceString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ToolsInvokePayload;
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid tool payload." }, { status: 400 });
    }
    const tool = coerceString(body.tool);
    if (!tool) {
      return NextResponse.json({ error: "Tool name is required." }, { status: 400 });
    }
    const settings = loadStudioSettings();
    const gatewayUrl = settings.gateway?.url?.trim() ?? "";
    if (!gatewayUrl) {
      return NextResponse.json({ error: "Gateway URL is not configured." }, { status: 400 });
    }
    const httpBase = toGatewayHttpUrl(gatewayUrl).replace(/\/$/, "");
    const target = `${httpBase}/tools/invoke`;
    const payload: Record<string, unknown> = { tool };
    const action = coerceString(body.action);
    if (action) payload.action = action;
    if (isRecord(body.args)) payload.args = body.args;
    const sessionKey = coerceString(body.sessionKey);
    if (sessionKey) payload.sessionKey = sessionKey;
    if (typeof body.dryRun === "boolean") payload.dryRun = body.dryRun;

    const headers: HeadersInit = { "Content-Type": "application/json" };
    const token = settings.gateway?.token?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(target, {
      method: "POST",
      headers,
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
        data && typeof data === "object" && "error" in data
          ? (data as Record<string, unknown>).error
          : null;
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as Record<string, unknown>).message)
          : `Gateway tool invoke failed with status ${res.status}.`;
      logger.error(message);
      return NextResponse.json({ error: message }, { status: res.status });
    }
    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { error: "Gateway tool response was invalid." },
        { status: 502 }
      );
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to invoke gateway tool.";
    logger.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
