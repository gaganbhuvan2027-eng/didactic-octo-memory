import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profileData = await request.json()

    // Get existing user to merge preferences (don't overwrite name, etc.)
    const { data: existing } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle()

    const existingPrefs = (existing?.preferences as Record<string, unknown>) || {}
    const newPrefs = {
      ...existingPrefs,
      career_stage: profileData.careerStage ?? existingPrefs.career_stage,
      years_of_experience: profileData.yearsOfExperience ?? existingPrefs.years_of_experience,
      current_role: profileData.currentRole ?? existingPrefs.current_role,
      target_role: profileData.targetRole ?? existingPrefs.target_role,
      onboarding_completed: true,
    }

    // Only update preferences (and optional fields if provided) - preserve existing user data
    const updatePayload: Record<string, unknown> = {
      preferences: newPrefs,
    }
    if (profileData.name != null) updatePayload.name = profileData.name
    if (profileData.bio != null) updatePayload.bio = profileData.bio
    if (profileData.location != null) updatePayload.location = profileData.location
    if (profileData.skills != null) updatePayload.skills = profileData.skills
    if (profileData.education != null) updatePayload.education = profileData.education
    if (profileData.experience != null) updatePayload.experience = profileData.experience

    const { error: updateError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Error updating profile:", updateError)
      return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in onboarding:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
