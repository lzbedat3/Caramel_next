import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicEnv, isSupabaseConfigured } from "@/config/env";
import { isAdminLoginPath, isAdminPath, routes } from "@/config/routes";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
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
    if (isAdminPath(request.nextUrl.pathname) && !isAdminLoginPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = routes.adminLogin;
      url.searchParams.set("next", request.nextUrl.pathname);
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

  if (isAdminPath(pathname) && !isAdminLoginPath(pathname) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = routes.adminLogin;
    url.searchParams.set("next", pathname);

    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (isAdminLoginPath(pathname) && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = getSafeRedirectPath(
      request.nextUrl.searchParams.get("next"),
      routes.admin,
    );
    url.search = "";

    return applySupabaseCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}
