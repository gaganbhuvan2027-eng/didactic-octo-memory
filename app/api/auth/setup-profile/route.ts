import * as Sentry from "@sentry/nextjs"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * Sets up user profile and credits after OAuth sign-in.
 * Expects Authorization: Bearer <access_token> from the client.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  try {
    const adminSupabase = await createAdminClient()
    const [existingByIdResult, existingByEmailResult] = await Promise.all([
      adminSupabase.from("users").select("id, preferences").eq("id", user.id).maybeSingle(),
      user.email
        ? adminSupabase.from("users").select("id, preferences").eq("email", user.email).maybeSingle()
        : Promise.resolve({ data: null }),
    ])
    const existingById = existingByIdResult.data
    const existingByEmail = existingByEmailResult.data

    const baseProfile = {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      user_type: "user",
    }

    if (existingById) {
      await adminSupabase
        .from("users")
        .update({ email: baseProfile.email, name: baseProfile.name })
        .eq("id", user.id)
    } else if (existingByEmail && existingByEmail.id !== user.id) {
      const prefs = (existingByEmail.preferences as Record<string, unknown>) || {}
      await adminSupabase.from("users").insert({
        ...baseProfile,
        created_at: new Date().toISOString(),
        preferences: prefs,
      })
    } else {
      await adminSupabase.from("users").insert({
        ...baseProfile,
        created_at: new Date().toISOString(),
        preferences: { onboarding_completed: false },
      })
    }

    const { data: existingCredits } = await adminSupabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()

    if (!existingCredits) {
      await adminSupabase.from("user_credits").insert({
        user_id: user.id,
        balance: 10,
        updated_at: new Date().toISOString(),
      })
      await adminSupabase.from("credit_transactions").insert({
        user_id: user.id,
        delta: 10,
        reason: "welcome_bonus",
        metadata: { source: "oauth_signup" },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    Sentry.captureException(err)
    console.error("[auth/setup-profile] Error:", err)
    return NextResponse.json({ error: "Profile setup failed" }, { status: 500 })
  }
}
