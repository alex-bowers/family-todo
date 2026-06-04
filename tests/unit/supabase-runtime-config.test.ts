import { describe, expect, it } from "vitest";
import { getSupabaseRuntimeConfig } from "$lib/utils/config";

describe("Supabase runtime config", () => {
  it("returns config object shape", () => {
    const config = getSupabaseRuntimeConfig();

    expect(config).toHaveProperty("url");
    expect(config).toHaveProperty("anonKey");
  });
});
