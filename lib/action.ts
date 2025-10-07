"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import { CreatePitchData, Pitch, UpdatePitchData } from "@/lib/types/pitch";

import {
  User,
  BusinessUser,
  UpdateUserData,
  UpdateBusinessUserData,
} from "@/lib/types/user";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  console.log("Login attempt:", data); // log input

  const { data: userData, error } = await supabase.auth.signInWithPassword(
    data
  );

  if (error) {
    redirect("/error");
  }

  const { data: userDetails, error: userError } = await supabase
    .from("user")
    .select("account_type")
    .eq("email", data.email)
    .single();

  if (userError || !userDetails) {
    redirect("/error");
  }

  // Store user role in cookie for middleware
  const cookieStore = await cookies();
  cookieStore.set("user_role", userDetails.account_type, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  if (userDetails.account_type === "investor") {
    redirect("/investor/portfolio");
  } else if (userDetails.account_type === "business") {
    redirect("/business");
  } else {
    redirect("/error");
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    accountType: formData.get("accountType") as string, // "investor" or "business"
  };

  console.log("Signup attempt:", data);

  // Sign up with Supabase Auth
  const { data: userData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error("Signup error:", error);
    redirect("/error");
  }

  // Insert user info into your 'user' table with correct id
  const supabaseUserId = userData?.user?.id;
  if (!supabaseUserId) {
    console.error("No Supabase user id found after signup");
    redirect("/error");
  }

  // Mess with this to test or set up default values.
  const { error: tableError } = await supabase.from("user").insert([
    {
      id: userData.user?.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      account_type: data.accountType,
      account_balance: 0,
      total_invested: 0,
      total_returns: 0,
      overall_roi: 0,
    },
  ]);

  if (tableError) {
    console.error("Error inserting into user table:", tableError);
    redirect("/error");
  }

  console.log("Signup success:", userData);

  // Store user role in cookie for middleware
  const cookieStore = await cookies();
  cookieStore.set("user_role", data.accountType, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  revalidatePath("/", "layout");

  if (!userData.session) {
    redirect("/signin?confirm=1");
  } else {
    if (data.accountType === "business") {
      redirect("/business-setup");
    } else {
      redirect("/investor/portfolio");
    }
  }
}

export async function createBusinessUser(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("User not authenticated:", userError);
    redirect("/error");
  }

  const data = {
    businessName: formData.get("businessName") as string,
    description: formData.get("description") as string,
    website: formData.get("website") as string,
    logoUrl: formData.get("logoUrl") as string,
    phoneNumber: formData.get("phoneNumber") as string,
    location: formData.get("location") as string,
  };

  console.log("Business user creation attempt:", data);

  // Insert business user info into the 'businessuser' table
  const { error: businessUserError } = await supabase
    .from("businessuser")
    .insert([
      {
        user_id: user.id,
        business_name: data.businessName,
        description: data.description,
        website: data.website || null,
        logo_url: data.logoUrl || null,
        phone_number: data.phoneNumber || null,
        location: data.location,
      },
    ]);

  if (businessUserError) {
    console.error(
      "Error inserting into businessuser table:",
      businessUserError
    );
    redirect("/error");
  }

  console.log("Business user creation success");
  revalidatePath("/", "layout");
  redirect("/business");
}

// Pitch-related actions
export async function createPitch(
  pitchData: CreatePitchData
): Promise<{ success: boolean; data?: Pitch; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get business_id from the businessuser table
    const { data: businessUser, error: businessError } = await supabase
      .from("businessuser")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (businessError || !businessUser) {
      return { success: false, error: "Business user not found" };
    }

    // Generate a unique ID for the pitch
    const pitchId = `pitch_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Insert the pitch
    const { data: pitch, error: pitchError } = await supabase
      .from("pitch")
      .insert([
        {
          id: pitchId,
          title: pitchData.title,
          elevator_pitch: pitchData.elevator_pitch,
          detailed_pitch: pitchData.detailed_pitch,
          target_amount: pitchData.target_amount,
          profit_share: pitchData.profit_share,
          profit_distribution_frequency:
            pitchData.profit_distribution_frequency,
          tags: pitchData.tags,
          end_date: pitchData.end_date,
          investment_tiers: pitchData.investment_tiers,
          ai_analysis: pitchData.ai_analysis || null,
          supporting_media: pitchData.supporting_media || [],
          business_id: businessUser.id,
          status: "draft",
        },
      ])
      .select()
      .single();

    if (pitchError) {
      console.error("Error creating pitch:", pitchError);
      return { success: false, error: pitchError.message };
    }

    revalidatePath("/business/my-pitches");
    return { success: true, data: pitch };
  } catch (error) {
    console.error("Unexpected error creating pitch:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPitches(): Promise<{
  success: boolean;
  data?: Pitch[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }
    console.log("User:", user);

    // Get business_id from the businessuser table
    const { data: businessUser, error: businessError } = await supabase
      .from("businessuser")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (businessError || !businessUser) {
      return { success: false, error: "Business user not found" };
    }

    // Fetch pitches for this business user
    const { data: pitches, error: pitchesError } = await supabase
      .from("pitch")
      .select("*")
      .eq("business_id", businessUser.id)
      .order("created_at", { ascending: false });

    if (pitchesError) {
      console.error("Error fetching pitches:", pitchesError);
      return { success: false, error: pitchesError.message };
    }

    return { success: true, data: pitches || [] };
  } catch (error) {
    console.error("Unexpected error fetching pitches:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updatePitch(
  pitchId: string,
  updateData: UpdatePitchData
): Promise<{ success: boolean; data?: Pitch; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get business_id from the businessuser table
    const { data: businessUser, error: businessError } = await supabase
      .from("businessuser")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (businessError || !businessUser) {
      return { success: false, error: "Business user not found" };
    }

    const { data: pitch, error: pitchError } = await supabase
      .from("pitch")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pitchId)
      .eq("business_id", businessUser.id)
      .select()
      .single();

    if (pitchError) {
      console.error("Error updating pitch:", pitchError);
      return { success: false, error: pitchError.message };
    }

    revalidatePath("/business/my-pitches");
    return { success: true, data: pitch };
  } catch (error) {
    console.error("Unexpected error updating pitch:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deletePitch(
  pitchId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: businessUser, error: businessError } = await supabase
      .from("businessuser")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (businessError || !businessUser) {
      return { success: false, error: "Business user not found" };
    }

    const { error: pitchError } = await supabase
      .from("pitch")
      .delete()
      .eq("id", pitchId)
      .eq("business_id", businessUser.id);

    if (pitchError) {
      console.error("Error deleting pitch:", pitchError);
      return { success: false, error: pitchError.message };
    }

    revalidatePath("/business/my-pitches");
    return { success: true };
  } catch (error) {
    console.error("Unexpected error deleting pitch:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getPitchById(pitchId: string): Promise<{
  success: boolean;
  data?: Pitch & {
    business_name?: string;
    business_description?: string | null;
    business_website?: string | null;
    business_logo_url?: string | null;
    business_location?: string | null;
    is_owner?: boolean;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let currentUserBusinessId: string | null = null;

    if (!userError && user) {
      const { data: businessUser } = await supabase
        .from("businessuser")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (businessUser) {
        currentUserBusinessId = businessUser.id;
      }
    }

    const { data: pitch, error: pitchError } = await supabase
      .from("pitch")
      .select(
        `
        *,
        businessuser!inner(
          business_name,
          description,
          website,
          logo_url,
          location
        )
      `
      )
      .eq("id", pitchId)
      .single();

    if (pitchError) {
      console.error("Error fetching pitch:", pitchError);
      return { success: false, error: pitchError.message };
    }

    if (!pitch) {
      return { success: false, error: "Pitch not found" };
    }

    const transformedPitch = {
      ...pitch,
      business_name: pitch.businessuser?.business_name || "Unknown Business",
      business_description: pitch.businessuser?.description || null,
      business_website: pitch.businessuser?.website || null,
      business_logo_url: pitch.businessuser?.logo_url || null,
      business_location: pitch.businessuser?.location || null,
      is_owner: currentUserBusinessId === pitch.business_id,
    };

    return { success: true, data: transformedPitch };
  } catch (error) {
    console.error("Unexpected error fetching pitch:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getCurrentUser(): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: user, error: userError } = await supabase
      .from("user")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (userError) {
      console.error("Error fetching user profile:", userError);
      return { success: false, error: userError.message };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error);

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getCurrentBusinessUser(): Promise<{
  success: boolean;
  data?: BusinessUser;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: businessUser, error: businessError } = await supabase
      .from("businessuser")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    if (businessError) {
      console.error("Error fetching business user profile:", businessError);
      return { success: false, error: businessError.message };
    }

    return { success: true, data: businessUser };
  } catch (error) {
    console.error("Unexpected error fetching business user profile:", error);

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateUserProfile(
  userData: UpdateUserData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const { error: updateError } = await supabase
      .from("user")
      .update(userData)
      .eq("id", authUser.id);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating user profile:", error);

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function updateBusinessUserProfile(
  businessData: UpdateBusinessUserData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const { error: updateError } = await supabase
      .from("businessuser")
      .update(businessData)
      .eq("user_id", authUser.id);

    if (updateError) {
      console.error("Error updating business user profile:", updateError);
      return { success: false, error: updateError.message };
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error) {
    console.error("Unexpected error updating business user profile:", error);

    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return { success: false, error: error.message };
    }

    // Clear user role cookie
    const cookieStore = await cookies();
    cookieStore.delete("user_role");

    revalidatePath("/", "layout");
    redirect("/signin");
  } catch (error) {
    console.error("Unexpected error signing out:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getRandomPitch() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pitch")
    .select("*")
    .limit(1)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getActivePitchCount(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("pitch")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");
    if (error) return { success: false, error: error.message };
    return { success: true, count: count ?? 0 };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function getActiveInvestorCount(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("user")
      .select("id", { count: "exact", head: true })
      .eq("account_type", "investor");

    if (error) return { success: false, error: error.message };
    return { success: true, count: count ?? 0 };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}
export async function getTotalFunded(): Promise<{
  success: boolean;
  total?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pitch")
      .select("current_amount");

    if (error) return { success: false, error: error.message };
    const total = Array.isArray(data)
      ? data.reduce((sum, p) => sum + (p.current_amount || 0), 0)
      : 0;
    return { success: true, total };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function declareProfits(
  pitchId: string,
  profitAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    //
    const { data: pitch, error: pitchError } = await supabase
      .from("pitch")
      .select("*")
      .eq("id", pitchId)
      .single();
    if (pitchError || !pitch) {
      return { success: false, error: "Pitch not found" };
    }

    const { data: businessUser, error: businessUserError } = await supabase
      .from("businessuser")
      .select("user_id")
      .eq("id", pitch.business_id)
      .single();
    if (businessUserError || !businessUser) {
      return { success: false, error: "Business user not found" };
    }

    const { data: user, error: userError } = await supabase
      .from("user")
      .select("account_balance")
      .eq("id", businessUser.user_id)
      .single();
    if (userError || !user) {
      return { success: false, error: "Business user account not found" };
    }

    if (
      typeof user.account_balance !== "number" ||
      user.account_balance < profitAmount
    ) {
      return {
        success: false,
        error: "Insufficient account balance to declare this profit amount.",
      };
    }

    const newBusinessBalance = user.account_balance - profitAmount;
    const { error: updateBusinessError } = await supabase
      .from("user")
      .update({ account_balance: newBusinessBalance })
      .eq("id", businessUser.user_id);
    if (updateBusinessError) {
      return {
        success: false,
        error: "Failed to update business account balance.",
      };
    }

    const businessProfitShare = pitch.profit_share ?? 0;
    const businessProfitShareAmount =
      profitAmount * (businessProfitShare / 100);
    const businessProfit = profitAmount - businessProfitShareAmount;

    const { data: profitDist, error: profitDistError } = await supabase
      .from("profit_distribution")
      .insert({
        pitch_id: pitchId,
        total_profit: profitAmount,
        business_profit: businessProfit,
        distribution_date: new Date().toISOString(),
      })
      .select()
      .single();
    if (profitDistError || !profitDist) {
      console.error("Error declaring profits:", profitDistError);
      return {
        success: false,
        error: profitDistError?.message || "Error declaring profits",
      };
    }
    //
    if (
      typeof pitch.current_amount === "number" &&
      typeof pitch.target_amount === "number"
    ) {
      if (pitch.current_amount < pitch.target_amount) {
        return {
          success: false,
          error: "Pitch is not fully funded. Cannot declare profits.",
        };
      }
    }

    // interval and end_date for profit declaration

    const { data: distributions, error: distError } = await supabase
      .from("profit_distribution")
      .select("distribution_date")
      .eq("pitch_id", pitchId)
      .order("distribution_date", { ascending: false });
    if (distError) {
      return {
        success: false,
        error: "Error checking previous profit distributions.",
      };
    }

    const now = new Date();
    const intervalMonths = 0; // CHANGE THIS TO ADJUST PROFIT DECLARATION INTERVAL 3 or 12 months
    if (!distributions || distributions.length === 0) {
      if (pitch.end_date) {
        const endDate = new Date(pitch.end_date);
        if (now < endDate) {
          return {
            success: false,
            error: `First profit can only be declared after pitch end date (${endDate.toLocaleDateString()})`,
          };
        }
      }
    } else {
      const lastDist = new Date(distributions[0].distribution_date);
      const nextAllowed = new Date(lastDist);
      nextAllowed.setMonth(nextAllowed.getMonth() + intervalMonths);
      if (now < nextAllowed) {
        return {
          success: false,
          error: `Next profit can only be declared after ${nextAllowed.toLocaleDateString()}`,
        };
      }
    }
    //
    const { data: investments, error: invError } = await supabase
      .from("investment")
      .select("*")
      .eq("pitch_id", pitchId);

    if (invError) {
      return { success: false, error: "Error fetching investments" };
    }

    const profitShare = pitch.profit_share ?? 0;
    const profitShareAmount = profitAmount * (profitShare / 100);

    const weightedInvestments = investments.map((inv: any) => {
      let tierMultiplier = 1;
      if (Array.isArray(pitch.investment_tiers)) {
        const tier = pitch.investment_tiers.find(
          (t: any) => t.name === inv.tier?.name
        );
        if (tier) {
          tierMultiplier = Number(tier.multiplier) || 1;
        }
      }
      return {
        investor_id: inv.investor_id,
        investment_amount: inv.investment_amount,
        weighted: inv.investment_amount * tierMultiplier,
      };
    });

    const totalWeighted = weightedInvestments.reduce(
      (sum, w) => sum + w.weighted,
      0
    );
    const payouts = weightedInvestments.map((w) => {
      const payoutAmount =
        totalWeighted > 0
          ? (w.weighted / totalWeighted) * profitShareAmount
          : 0;

      const payoutObj = {
        distribution_id: profitDist.id,
        investor_id: w.investor_id,
        amount: payoutAmount,
        percentage:
          profitShareAmount > 0 ? (payoutAmount / profitShareAmount) * 100 : 0,
        investment_amount: w.investment_amount,
        weighted: w.weighted,
        totalWeighted,
        profitShareAmount,
        profitShare,
        profitAmount,
      };
      console.log("[declareProfits] Computed payout:", payoutObj);
      return {
        distribution_id: payoutObj.distribution_id,
        investor_id: payoutObj.investor_id,
        amount: payoutObj.amount,
        percentage: payoutObj.percentage,
      };
    });

    for (const payout of payouts) {
      const { error: payoutError } = await supabase
        .from("investor_payout")
        .insert(payout);

      if (payoutError) {
        console.error(
          `[declareProfits] Error inserting payout for investor ${payout.investor_id}:`,
          payoutError
        );
      } else {
        console.log(
          `[declareProfits] Payout inserted for investor ${
            payout.investor_id
          }: $${payout.amount.toFixed(2)}`
        );
      }

      const { data: user, error: userError } = await supabase
        .from("user")
        .select("account_balance")
        .eq("id", payout.investor_id)
        .single();

      if (!userError && user) {
        const newBalance = (user.account_balance || 0) + payout.amount;
        const { error: updateError } = await supabase
          .from("user")
          .update({ account_balance: newBalance })
          .eq("id", payout.investor_id);
        if (updateError) {
          console.error(
            `[declareProfits] Error updating account balance for investor ${payout.investor_id}:`,
            updateError
          );
        } else {
          console.log(
            `[declareProfits] Account balance updated for investor ${
              payout.investor_id
            }: $${newBalance.toFixed(2)}`
          );
        }
      } else {
        console.error(
          `[declareProfits] Error fetching user for investor ${payout.investor_id}:`,
          userError
        );
      }
    }

    console.log(
      `[declareProfits] All payouts processed for pitch ${pitchId}, profitAmount $${profitAmount}`
    );
    return { success: true };
  } catch (error) {
    console.error("Unexpected error declaring profits:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function fetchProfitDistributions(
  pitchId: string
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profit_distribution")
      .select("*")
      .eq("pitch_id", pitchId)
      .order("distributed_at", { ascending: false });
    if (error) {
      console.error("Error fetching profit distributions:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Unexpected error fetching profit distributions:", error);
    return { success: false, error: "Unexpected error" };
  }
}

export async function previewProfitDistribution(
  pitchId: string,
  profitAmount: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: pitch, error: pitchError } = await supabase
      .from("pitch")
      .select("*")
      .eq("id", pitchId)
      .single();
    if (pitchError || !pitch) {
      return { success: false, error: "Pitch not found" };
    }

    const { data: investments, error: invError } = await supabase
      .from("investment")
      .select("*")
      .eq("pitch_id", pitchId);
    if (invError) {
      return { success: false, error: "Error fetching investments" };
    }

    const profitShare = pitch.profit_share ?? 0;
    const profitShareAmount = profitAmount * (profitShare / 100);

    // Group investments by investor_id
    const investorMap: Record<
      string,
      {
        investment_amount: number;
        weighted: number;
        tiers: { name: string; multiplier: number }[];
      }
    > = {};
    for (const inv of investments) {
      let tierMultiplier = 1;
      let tierName = "";
      if (Array.isArray(pitch.investment_tiers)) {
        const tier = pitch.investment_tiers.find(
          (t: any) => t.name === inv.tier?.name
        );
        if (tier) {
          tierMultiplier = Number(tier.multiplier) || 1;
          tierName = tier.name;
        }
      }
      if (!investorMap[inv.investor_id]) {
        investorMap[inv.investor_id] = {
          investment_amount: 0,
          weighted: 0,
          tiers: [],
        };
      }
      investorMap[inv.investor_id].investment_amount += inv.investment_amount;
      investorMap[inv.investor_id].weighted +=
        inv.investment_amount * tierMultiplier;
      investorMap[inv.investor_id].tiers.push({
        name: tierName,
        multiplier: tierMultiplier,
      });
    }
    const totalWeighted = Object.values(investorMap).reduce(
      (sum, v) => sum + v.weighted,
      0
    );
    const investorPayouts = Object.entries(investorMap).map(
      ([investor_id, v]) => {
        const payoutAmount =
          totalWeighted > 0
            ? (v.weighted / totalWeighted) * profitShareAmount
            : 0;
        return {
          investor_id,
          investment_amount: v.investment_amount,
          amount: payoutAmount,
          percentage:
            profitShareAmount > 0
              ? (payoutAmount / profitShareAmount) * 100
              : 0,
        };
      }
    );
    const totalInvested = investments.reduce(
      (sum, inv) => sum + (inv.investment_amount || 0),
      0
    );
    const businessKeeps = profitAmount - profitShareAmount;
    const uniqueInvestorCount = Object.keys(investorMap).length;
    const preview = {
      total_profit: profitAmount,
      total_to_investors: profitShareAmount,
      business_keeps: businessKeeps,
      profit_share_percentage: profitShare,
      investor_count: uniqueInvestorCount,
      total_invested: totalInvested,
      investor_payouts: investorPayouts,
    };
    return { success: true, data: preview };
  } catch (error) {
    console.error("Unexpected error previewing profit distribution:", error);
    return { success: false, error: "Unexpected error" };
  }
}

// Transaction actions for deposits and withdrawals
export async function depositFunds(
  amount: number,
  cardDetails: {
    cardNumber: string;
    cardExpiry: string;
    cardCvv: string;
    cardName: string;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate amount
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than £0" };
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("account_balance")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: "User not found" };
    }

    // Update user balance first (instant fake deposit)
    const newBalance = Number(userData.account_balance) + Number(amount);
    const { error: updateError } = await supabase
      .from("user")
      .update({ account_balance: newBalance })
      .eq("id", authUser.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return { success: false, error: "Failed to update account balance" };
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: authUser.id,
          amount: amount,
          type: "deposit",
          status: "completed",
          payment_method: "card",
        },
      ])
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Don't fail the whole operation if transaction record fails
    }

    revalidatePath("/", "layout");
    return { success: true, data: { transaction, newBalance } };
  } catch (error) {
    console.error("Unexpected error depositing funds:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function withdrawFunds(
  amount: number,
  bankDetails: {
    accountNumber: string;
    sortCode: string;
    accountName: string;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    // Validate amount
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than £0" };
    }

    // Get current user data
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("account_balance")
      .eq("id", authUser.id)
      .single();

    if (userError || !userData) {
      return { success: false, error: "User not found" };
    }

    // Check if user has sufficient balance
    if (Number(userData.account_balance) < Number(amount)) {
      return { success: false, error: "Insufficient balance" };
    }

    // Update user balance first (instant fake withdrawal)
    const newBalance = Number(userData.account_balance) - Number(amount);
    const { error: updateError } = await supabase
      .from("user")
      .update({ account_balance: newBalance })
      .eq("id", authUser.id);

    if (updateError) {
      console.error("Error updating balance:", updateError);
      return { success: false, error: "Failed to update account balance" };
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert([
        {
          user_id: authUser.id,
          amount: amount,
          type: "withdraw",
          status: "completed",
          payment_method: "bank_account",
        },
      ])
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Don't fail the whole operation if transaction record fails
    }

    revalidatePath("/", "layout");
    return { success: true, data: { transaction, newBalance } };
  } catch (error) {
    console.error("Unexpected error withdrawing funds:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getTransactionHistory(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });

    if (transactionsError) {
      console.error("Error fetching transactions:", transactionsError);
      return { success: false, error: transactionsError.message };
    }

    return { success: true, data: transactions || [] };
  } catch (error) {
    console.error("Unexpected error fetching transactions:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
