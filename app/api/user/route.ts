import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Simple in-memory cache for user data (expires after 5 minutes)
const userCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check cache first
    const cacheKey = user.email!;
    const cached = userCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("[User API] Returning cached user data for:", user.email);
      return NextResponse.json(cached.data);
    }

    // Get user details from database with optimized query
    const { data: userDetails, error: userError } = await supabase
      .from("user")
      .select(
        "account_type, first_name, last_name, created_at, account_balance"
      )
      .eq("email", user.email)
      .single();

    if (userError || !userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const responseData = {
      role: userDetails.account_type,
      email: user.email,
      first_name: userDetails.first_name,
      last_name: userDetails.last_name,
      created_at: userDetails.created_at,
      account_balance: userDetails.account_balance,
    };

    // Cache the response
    userCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (userCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of userCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          userCache.delete(key);
        }
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in user API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
