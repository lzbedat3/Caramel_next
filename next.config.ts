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

function supabaseImagePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
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
  images: {
    remotePatterns: supabaseImagePatterns(),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      allowedOrigins: localOrigins,
    },
  },
};

export default nextConfig;
