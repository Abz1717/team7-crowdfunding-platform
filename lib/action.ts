"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { CreatePitchData, Pitch, UpdatePitchData } from "@/lib/types/pitch";

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

  if (userDetails.account_type === "investor") {
    redirect("/investor");
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
      id: supabaseUserId,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      account_type: data.accountType,
      account_balance: 20,
    },
  ]);

  if (tableError) {
    console.error("Error inserting into user table:", tableError);
  }

  console.log("Signup success:", userData);
  revalidatePath("/", "layout");
  redirect("/");
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
      .from("pitches")
      .insert([
        {
          id: pitchId,
          title: pitchData.title,
          elevator_pitch: pitchData.elevator_pitch,
          detailed_pitch: pitchData.detailed_pitch,
          target_amount: pitchData.target_amount,
          profit_share: pitchData.profit_share,
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
      .from("pitches")
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

    // Update the pitch
    const { data: pitch, error: pitchError } = await supabase
      .from("pitches")
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

    // Delete the pitch
    const { error: pitchError } = await supabase
      .from("pitches")
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