"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

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

  if (data.accountType === "investor") {
    redirect("/investor");
  } else if (data.accountType === "business") {
    redirect("/business");
  } else {
    redirect("/");
  }
}