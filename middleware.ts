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
  const isBusinessSetupRoute = path === "/business-setup";
  const isBusinessRoute = path.startsWith("/business") && !isBusinessSetupRoute;
  const isInvestorRoute = path.startsWith("/investor");
 
  // If user is authenticated, get their role from the database
  let userRole: "business" | "investor" | null = null;
  let userExistsInDatabase = false;
  if (user) {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("account_type")
        .eq("email", user.email)
        .single();

      if (!error && data) {
        userRole = data.account_type as "business" | "investor";
        userExistsInDatabase = true;
      } else {
        console.log("User exists in Supabase auth but not in database:", user.email);
        userExistsInDatabase = false;
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      userExistsInDatabase = false;
    }
  }  // Fallback to role cookie set during signup/login to avoid race conditions
  const userRoleCookie = request.cookies.get("user_role")?.value as
    | "business"
    | "investor"
    | undefined;
  const effectiveRole: "business" | "investor" | null = (userRole ||
    userRoleCookie ||
    null) as any;
  // Route protection logic
  if (user) {
    // If user exists in Supabase but not in database, treat as unauthenticated
    if (!userExistsInDatabase) {
      
      if (userRoleCookie) {
        console.log("Using role cookie as fallback:", userRoleCookie);
        if (userRoleCookie === "investor" && isInvestorRoute) {
          console.log("Allowing investor access with cookie fallback");
          return supabaseResponse;
        }
      } else {
        if (isBusinessRoute || isInvestorRoute) {
          return NextResponse.redirect(new URL("/signin?error=session_expired", request.url));
        }
                return supabaseResponse;
      }
    }

    if (effectiveRole === "business" && isBusinessRoute) {
      try {
        const { data: businessUser, error: businessError } = await supabase
          .from("businessuser")
          .select("business_name, description, location")
          .eq("user_id", user.id)
          .single();

        if (businessError || !businessUser || 
            !businessUser.business_name || 
            !businessUser.description || 
            !businessUser.location) {
          return NextResponse.redirect(new URL("/business-setup", request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL("/business-setup", request.url));
      }
    }

    // Authenticated users cannot access signin/signup pages
    if (isAuthRoute && effectiveRole) {
      const redirectUrl =
        effectiveRole === "business" ? "/business" : "/investor";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    if (effectiveRole === "business" && isInvestorRoute) {
      const allowedInvestorPaths = [
        "/investor/browse-pitches",
        "/investor/browse-pitches/",
      ];
      if (
        path === "/investor/browse-pitches" ||
        path === "/investor/browse-pitches/" ||
        path.startsWith("/investor/browse-pitches/")
      ) {
        // allow
      } else {
        return NextResponse.redirect(new URL("/business", request.url));
      }
    }

    // Investor users cannot access business routes
    if (effectiveRole === "investor" && isBusinessRoute) {
      return NextResponse.redirect(new URL("/investor", request.url));
    }
    
    if (effectiveRole === "investor" && isInvestorRoute) {
      return supabaseResponse;
    }
    
    if (isInvestorRoute && !effectiveRole) {
      console.log("Investor route accessed with no effective role:", {
        path,
        userRole,
        userRoleCookie,
        userExistsInDatabase
      });
    }
    
    // If role is unknown yet (race condition), allow the request through.
  } else {
    if (isBusinessSetupRoute) {
      const userRoleCookie = request.cookies.get("user_role")?.value;
      if (userRoleCookie === "business") {
        return supabaseResponse;
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    
    if (isBusinessRoute || isInvestorRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }  return supabaseResponse;
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
 