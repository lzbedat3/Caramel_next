import os from "node:os";
import type { NextConfig } from "next";

function localDevOrigins(): string[] {
  const origins = new Set(["127.0.0.1"]);

  try {
    for (const addresses of Object.values(os.networkInterfaces())) {
      for (const address of addresses ?? []) {
        if (address.internal) {
          continue;
        }

        if (address.family === "IPv4") {
          origins.add(address.address);
        }
      }
    }
  } catch {
    // Some environments cannot enumerate network interfaces.
  }

  return [...origins];
}

function supabaseImagePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/object/public/**",
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return patterns;
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return patterns;
    }

    patterns.push({
      protocol: parsed.protocol === "http:" ? "http" : "https",
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
      pathname: "/storage/v1/object/public/**",
    });
  } catch {
    return patterns;
  }

  return patterns;
}

const localOrigins = localDevOrigins();

const nextConfig: NextConfig = {
  allowedDevOrigins: localOrigins,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: supabaseImagePatterns(),
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    qualities: [70, 75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [48, 64, 96, 128, 160, 256, 384],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      allowedOrigins: localOrigins,
    },
  },
};

export default nextConfig;
