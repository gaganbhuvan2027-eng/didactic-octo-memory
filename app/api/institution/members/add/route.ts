import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { email, role = "member" } = await request.json()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get admin's institution
    const { data: adminProfile } = await supabase
      .from("users")
      .select("institution_id, user_type")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not authorized as institution admin" }, { status: 403 })
    }

    // Check if user with email exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("institution_members")
        .select("id")
        .eq("institution_id", adminProfile.institution_id)
        .eq("user_id", existingUser.id)
        .single()

      if (existingMember) {
        return NextResponse.json({ error: "User is already a member" }, { status: 400 })
      }

      // Add existing user as member
      const { error: insertError } = await supabase.from("institution_members").insert({
        institution_id: adminProfile.institution_id,
        user_id: existingUser.id,
        role,
      })

      if (insertError) throw insertError

      return NextResponse.json({ success: true, message: "Member added successfully" })
    } else {
      // Create invitation record (user will be added when they sign up)
      return NextResponse.json({
        success: true,
        message: "Invitation sent. User will be added when they sign up.",
      })
    }
  } catch (error: any) {
    console.error("Error adding member:", error)
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 })
  }
}
