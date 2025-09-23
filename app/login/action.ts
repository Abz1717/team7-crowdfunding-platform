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
    console.error("Login error:", error); // log error
    redirect("/error");
  }

  console.log("Login success:", userData); // log success
  revalidatePath("/", "layout");
  redirect("/account");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  console.log("Signup attempt:", data); // log input

  const { data: userData, error } = await supabase.auth.signUp(data);
  if (error) {
    console.error("Signup error:", error); // log error
    redirect("/error");
  }

   // 2️⃣ Insert email into your 'user' table
  const { error: tableError } = await supabase
    .from("user")
    .insert([{ email: data.email }]);

  if (tableError) {
    console.error("Error inserting into user table:", tableError);
  }

  console.log("Signup success:", userData); // log success
  revalidatePath("/", "layout");
  redirect("/account");
}
