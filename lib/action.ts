"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    console.error("Login error:", error); // log error
    redirect("/error");
  }

  console.log("Login success:", userData); // log success
  revalidatePath("/", "layout");
  redirect("/");
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

  // Insert user info into your 'user' table
  const { error: tableError } = await supabase.from("user").insert([
    {
      id: userData.user?.id, // Include the auth user ID
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      account_type: data.accountType,
      account_balance: 0,
    },
  ]);

  if (tableError) {
    console.error("Error inserting into user table:", tableError);
  }

  console.log("Signup success:", userData);
  revalidatePath("/", "layout");

  // Redirect business users to business setup page
  if (data.accountType === "business") {
    redirect("/business-setup");
  } else {
    redirect("/");
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
      console.error("Error fetching pitch:", pitchesError);
      return { success: false, error: pitchesError.message };
    }

    return { success: true, data: pitches || [] };
  } catch (error) {
    console.error("Unexpected error fetching pitch:", error);
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

// Get all active pitches for browsing
export async function getAllActivePitches(): Promise<{
  success: boolean;
  data?: (Pitch & {
    business_name?: string;
    business_description?: string | null;
    business_website?: string | null;
    business_logo_url?: string | null;
    business_location?: string | null;
    is_owner?: boolean;
  })[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get the current user to determine ownership
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let currentUserBusinessId: string | null = null;

    if (!userError && user) {
      // Get business_id from the businessuser table for current user
      const { data: businessUser } = await supabase
        .from("businessuser")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (businessUser) {
        currentUserBusinessId = businessUser.id;
      }
    }

    // Fetch all active pitches with comprehensive business information
    const { data: pitches, error: pitchesError } = await supabase
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
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (pitchesError) {
      console.error("Error fetching active pitches:", pitchesError);
      return { success: false, error: pitchesError.message };
    }

    // Transform the data and add ownership information
    const transformedPitches =
      pitches?.map((pitch: any) => ({
        ...pitch,
        business_name: pitch.businessuser?.business_name || "Unknown Business",
        business_description: pitch.businessuser?.description || null,
        business_website: pitch.businessuser?.website || null,
        business_logo_url: pitch.businessuser?.logo_url || null,
        business_location: pitch.businessuser?.location || null,
        is_owner: currentUserBusinessId === pitch.business_id,
      })) || [];

    return { success: true, data: transformedPitches };
  } catch (error) {
    console.error("Unexpected error fetching active pitches:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// Get single pitch by ID with detailed information
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

    // Get the current user to determine ownership
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    let currentUserBusinessId: string | null = null;

    if (!userError && user) {
      // Get business_id from the businessuser table for current user
      const { data: businessUser } = await supabase
        .from("businessuser")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (businessUser) {
        currentUserBusinessId = businessUser.id;
      }
    }

    // Fetch the specific pitch with comprehensive business information
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

    // Transform the data and add ownership information
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

// User and Business Profile Management Functions

// Get current user profile
export async function getCurrentUser(): Promise<{
  success: boolean;
  data?: User;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch user profile from the user table
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

// Get current business user profile
export async function getCurrentBusinessUser(): Promise<{
  success: boolean;
  data?: BusinessUser;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    // Fetch business user profile from the businessuser table
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

// Update user profile
export async function updateUserProfile(
  userData: UpdateUserData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    // Update user profile in the user table
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

// Update business user profile
export async function updateBusinessUserProfile(
  businessData: UpdateBusinessUserData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: "User not authenticated" };
    }

    // Update business user profile in the businessuser table
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

// Sign out function
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    redirect("/signin");
  } catch (error) {
    console.error("Unexpected error signing out:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
