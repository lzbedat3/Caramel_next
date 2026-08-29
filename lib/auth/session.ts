import { isSupabaseConfigured } from "@/config/env";
import { createClient } from "@/lib/supabase/server";

export type AuthClaims = {
  email: string | null;
  sub: string | null;
};

function toAuthClaims(claims: Record<string, unknown>): AuthClaims {
  return {
    email: typeof claims.email === "string" ? claims.email : null,
    sub: typeof claims.sub === "string" ? claims.sub : null,
  };
}

export async function getAuthClaims(): Promise<AuthClaims | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    return toAuthClaims(data.claims as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function currentUserIsAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("current_user_is_admin");

    return !error && data === true;
  } catch {
    return false;
  }
}

export type AdminAccess =
  | { status: "unauthenticated" }
  | { status: "forbidden"; claims: AuthClaims }
  | { status: "ok"; claims: AuthClaims };

export async function getAdminAccess(): Promise<AdminAccess> {
  const claims = await getAuthClaims();

  if (!claims) {
    return { status: "unauthenticated" };
  }

  const isAdmin = await currentUserIsAdmin();
  if (!isAdmin) {
    return { status: "forbidden", claims };
  }

  return { status: "ok", claims };
}
