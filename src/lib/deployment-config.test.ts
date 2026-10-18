// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";
import nextConfig from "../../next.config";

describe("deployment configuration", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("allows a production build with both required public variables", () => {
    expect(nextConfig(PHASE_PRODUCTION_BUILD)).toHaveProperty(
      "poweredByHeader",
      false,
    );
  });

  it.each(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"])(
    "rejects a production build missing %s",
    (name) => {
      vi.stubEnv(name, undefined);
      expect(() => nextConfig(PHASE_PRODUCTION_BUILD)).toThrow(name);
    },
  );

  it("names both missing variables and tells the deployer to rebuild", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "   ");
    expect(() => nextConfig(PHASE_PRODUCTION_BUILD)).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.*rebuild/s,
    );
  });

  it("does not mistake the old Vite variables for browser configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "legacy-public-key");
    expect(() => nextConfig(PHASE_PRODUCTION_BUILD)).toThrow(/VITE_.*not used/);
  });

  it.each([PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_SERVER])(
    "does not require build variables again during %s",
    (phase) => {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
      expect(() => nextConfig(phase)).not.toThrow();
    },
  );
});
