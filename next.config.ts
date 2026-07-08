import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

function buildConnectSrc(): string {
  const parts = new Set<string>(["'self'"]);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try {
      const { origin, host } = new URL(url);
      parts.add(origin);
      parts.add(`wss://${host}`);
    } catch {
      // ignore malformed URL at build time
    }
  }
  return Array.from(parts).join(" ");
}

function contentSecurityPolicy(): string {
  // Next.js injects inline bootstrap scripts, so 'unsafe-inline' is required
  // without a nonce pipeline. Turbopack's dev runtime additionally needs
  // 'unsafe-eval'. Tailwind/next inject inline styles.
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${buildConnectSrc()}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
