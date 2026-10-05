import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only the signed-in areas need a session; the public menu skips the proxy.
  matcher: ["/admin/:path*", "/portal/:path*"],
};
