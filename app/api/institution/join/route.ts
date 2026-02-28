import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find institution by invite code
    const { data: institution, error: institutionError } = await supabase
      .from("institutions")
      .select("id, name")
      .eq("invite_code", inviteCode.toUpperCase())
      .single()

    if (institutionError || !institution) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("institution_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("institution_id", institution.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this institution" }, { status: 400 })
    }

    // Add user to institution_members
    const { error: memberError } = await supabase.from("institution_members").insert({
      user_id: user.id,
      institution_id: institution.id,
      role: "member",
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      console.error("Error adding member:", memberError)
      return NextResponse.json({ error: "Failed to join institution" }, { status: 500 })
    }

    // Update user's institution_id
    const { error: updateError } = await supabase
      .from("users")
      .update({ institution_id: institution.id })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating user:", updateError)
    }

    return NextResponse.json({
      success: true,
      institutionName: institution.name,
    })
  } catch (error) {
    console.error("Error joining institution:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
