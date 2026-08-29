import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv, isSupabaseConfigured } from "@/config/env";
import { getSafeAdminPath, isAdminPath, isPortalPath, routes } from "@/config/routes";
import type { Database } from "@/types/database";

function applySupabaseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });

  from.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      return;
    }

    to.headers.set(key, value);
  });

  return to;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!isSupabaseConfigured()) {
    if (isAdminPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = routes.home;
      url.search = "";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  const { supabaseUrl, supabasePublishableKey } = getPublicEnv();

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = routes.home;
    url.search = "";

    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (isPortalPath(pathname) && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = getSafeAdminPath(request.nextUrl.searchParams.get("next"));
    url.search = "";

    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}
