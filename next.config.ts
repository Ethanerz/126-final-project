import type { NextConfig } from "next";

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
export default config;
