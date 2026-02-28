import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { joinCode } = await request.json()

    if (!joinCode) {
      return NextResponse.json({ error: "Join code is required" }, { status: 400 })
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

    // Find batch by join code
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select(`
        id,
        name,
        institution_id,
        institutions!inner (
          id,
          name
        )
      `)
      .eq("join_code", joinCode.toUpperCase())
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 })
    }

    // Check if user is already a member of this batch
    const { data: existingBatchMember } = await supabase
      .from("batch_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("batch_id", batch.id)
      .maybeSingle()

    if (existingBatchMember) {
      return NextResponse.json({ error: "You are already a member of this batch" }, { status: 400 })
    }

    // Check if user is a member of the institution
    const { data: existingInstitutionMember } = await supabase
      .from("institution_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("institution_id", batch.institution_id)
      .maybeSingle()

    // If not a member of the institution, add them
    if (!existingInstitutionMember) {
      const { error: institutionMemberError } = await supabase.from("institution_members").insert({
        user_id: user.id,
        institution_id: batch.institution_id,
        role: "member",
        joined_at: new Date().toISOString(),
      })

      if (institutionMemberError) {
        console.error("Error adding to institution:", institutionMemberError)
        return NextResponse.json({ error: "Failed to join institution" }, { status: 500 })
      }

      // Update user's institution_id
      const { error: updateError } = await supabase
        .from("users")
        .update({ institution_id: batch.institution_id })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error updating user:", updateError)
      }
    }

    // Add user to batch
    const { error: batchMemberError } = await supabase.from("batch_members").insert({
      user_id: user.id,
      batch_id: batch.id,
      added_at: new Date().toISOString(),
    })

    if (batchMemberError) {
      console.error("Error adding to batch:", batchMemberError)
      return NextResponse.json({ error: "Failed to join batch" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      batchName: batch.name,
      institutionName: batch.institutions.name,
    })
  } catch (error) {
    console.error("Error joining batch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
