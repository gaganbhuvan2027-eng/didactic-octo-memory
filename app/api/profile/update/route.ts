import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, phone, location, skills, education, experience, social_links, preferences } = body

    // Update user profile
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        bio,
        phone,
        location,
        skills,
        education,
        experience,
        social_links,
        preferences,
      })
      .eq("id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error in profile update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
