import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name, email, password, institution_id } = await request.json();

    if (!name || !email || !password || !institution_id) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();

    // 1. Create user in Supabase Auth
    const { data: authUserData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Ensure email confirmation is required
      user_metadata: { name },
    });

    if (authError) {
      console.error("Error creating auth user for institution:", authError);
      return NextResponse.json({ error: authError.message || "Failed to create auth user" }, { status: 500 });
    }

    const newAuthUser = authUserData.user;

    // 2. Insert user profile into public.users table
    const { error: profileError } = await adminSupabase.from("users").upsert(
      {
        id: newAuthUser.id,
        email: newAuthUser.email,
        name: name,
        user_type: "institution_admin", // Mark as institution admin user
        institution_id: institution_id,
        preferences: {
          onboarding_completed: true, // Institution users might not need onboarding
        },
      },
      {
        onConflict: "id", // Handle potential conflicts
        ignoreDuplicates: false,
      }
    );

    if (profileError) {
      console.error("Error inserting institution user profile:", profileError);
      return NextResponse.json({ error: profileError.message || "Failed to create institution user profile" }, { status: 500 });
    }

    // Optionally, grant initial credits to institution users if needed
    // const { error: creditsError } = await adminSupabase.from("user_credits").insert({
    //   user_id: newAuthUser.id,
    //   balance: 0, // Or some initial amount for institution users
    //   updated_at: new Date().toISOString(),
    // });

    // if (creditsError) {
    //   console.error("Error granting initial credits to institution user:", creditsError);
    // }

    return NextResponse.json({
      message: "Institution user created successfully",
      userId: newAuthUser.id,
      email: newAuthUser.email,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Unhandled error creating institution user:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

