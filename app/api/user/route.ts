import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const debugCookies = request.headers.get('cookie');
      console.error('[API /api/user] Not authenticated', {
        authError,
        user,
        cookies: debugCookies,
      });
      return NextResponse.json({
        error: "Not authenticated",
        authError: authError?.message || null,
        cookies: debugCookies || null,
      }, { status: 401 });
    }

    // Get user details from database
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

    return NextResponse.json({
      role: userDetails.account_type,
      email: user.email,
      first_name: userDetails.first_name,
      last_name: userDetails.last_name,
      created_at: userDetails.created_at,
      account_balance: userDetails.account_balance,
    });
  } catch (error) {
    console.error("Error in user API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
