import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Define route types
  const isPublicRoute = path === "/";
  const isAuthRoute = path === "/signin" || path === "/signup";
  const isBusinessRoute =
    path.startsWith("/business") || path.startsWith("/business-setup");
  const isInvestorRoute = path.startsWith("/investor");

  // If user is authenticated, get their role from the database
  let userRole: "business" | "investor" | null = null;
  if (user) {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("account_type")
        .eq("email", user.email)
        .single();

      if (!error && data) {
        userRole = data.account_type as "business" | "investor";
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  }

  // Route protection logic
  if (user && userRole) {
    // Authenticated users cannot access signin/signup pages
    if (isAuthRoute) {
      const redirectUrl = userRole === "business" ? "/business" : "/investor";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Business users cannot access investor routes
    if (userRole === "business" && isInvestorRoute) {
      return NextResponse.redirect(new URL("/business", request.url));
    }

    // Investor users cannot access business routes
    if (userRole === "investor" && isBusinessRoute) {
      return NextResponse.redirect(new URL("/investor", request.url));
    }
  } else {
    // Unauthenticated users cannot access protected routes
    if (isBusinessRoute || isInvestorRoute) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
