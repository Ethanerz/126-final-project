import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const config: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/rating/:id", destination: "/places/:id", permanent: true },
      {
        source: "/rating/:id/:review",
        destination: "/places/:id/reviews/:review",
        permanent: true,
      },
      { source: "/mappreview", destination: "/map", permanent: true },
      { source: "/signin", destination: "/account", permanent: true },
      {
        source: "/signup",
        destination: "/account?mode=signup",
        permanent: true,
      },
      { source: "/profile", destination: "/account", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; frame-src https://www.openstreetmap.org`,
          },
        ],
      },
    ];
  },
};
export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) {
    const missing = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ].filter((name) => !process.env[name]?.trim());
    if (missing.length) {
      throw new Error(
        `Cannot build RateUPV: missing ${missing.join(", ")}. ` +
          "Set these variables for the intended Vercel deployment environment, then rebuild. " +
          "Legacy VITE_* variables are not used by the Next.js app. " +
          "See .env.example and docs/LAUNCH_RUNBOOK.md.",
      );
    }
  }
  return config;
}
