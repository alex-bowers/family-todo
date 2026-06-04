import type { UUID } from "./types";

const DEFAULT_HOUSEHOLD_KEY = "familytodo:household-id";
const FALLBACK_HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

export function resolveHouseholdId(): UUID {
  if (typeof localStorage !== "undefined") {
    const existing = localStorage.getItem(DEFAULT_HOUSEHOLD_KEY);
    if (existing) {
      return existing;
    }
  }

  const configured = import.meta.env.PUBLIC_HOUSEHOLD_ID;
  const resolved = configured || FALLBACK_HOUSEHOLD_ID;

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DEFAULT_HOUSEHOLD_KEY, resolved);
  }

  return resolved;
}

export function resolveDeviceId(): string {
  const key = "familytodo:device-id";

  if (typeof localStorage !== "undefined") {
    const existing = localStorage.getItem(key);
    if (existing) {
      return existing;
    }

    const generated = crypto.randomUUID();
    localStorage.setItem(key, generated);
    return generated;
  }

  return "server-device";
}
