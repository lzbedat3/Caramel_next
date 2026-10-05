import { NextResponse } from "next/server";

import { getSafeAdminPath, routes } from "@/config/routes";
import { getTrustedOrigin } from "@/lib/request-origin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeAdminPath(searchParams.get("next"));
  const origin = getTrustedOrigin(request);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}${routes.authError}`);
}
