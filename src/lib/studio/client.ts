import { fetchJson } from "@/lib/http";
import type { StudioSettings, StudioSettingsPatch } from "@/lib/studio/settings";

export type StudioSettingsResponse = { settings: StudioSettings };

export const fetchStudioSettings = async (): Promise<StudioSettingsResponse> => {
  return fetchJson<StudioSettingsResponse>("/api/studio", { cache: "no-store" });
};

export const updateStudioSettings = async (
  patch: StudioSettingsPatch
): Promise<StudioSettingsResponse> => {
  return fetchJson<StudioSettingsResponse>("/api/studio", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
};
