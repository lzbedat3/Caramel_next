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

type RemotePatterns = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>;

// Only this project's own storage may be optimised, and only at its plain
// address: every extra host or query string is one more image a stranger could
// have transformed on our account.
function supabaseImagePatterns(): RemotePatterns {
  const pathname = "/storage/v1/object/public/**";
  const anyProject: RemotePatterns = [
    { protocol: "https", hostname: "*.supabase.co", pathname, search: "" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return anyProject;
  }

  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return anyProject;
    }

    return [
      {
        protocol: parsed.protocol === "http:" ? "http" : "https",
        hostname: parsed.hostname,
        ...(parsed.port ? { port: parsed.port } : {}),
        pathname,
        search: "",
      },
    ];
  } catch {
    return anyProject;
  }
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
    // One quality and three widths: the sizes in lib/media/image-variants.ts.
    // Each stored photo can only ever be transformed into these.
    qualities: [75],
    deviceSizes: [768],
    imageSizes: [128, 448],
  },
  experimental: {
    // One root layout per language group, so unmatched addresses need this.
    globalNotFound: true,
    serverActions: {
      bodySizeLimit: "6mb",
      allowedOrigins: localOrigins,
    },
  },
};

export default nextConfig;
