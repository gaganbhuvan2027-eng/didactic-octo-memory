import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { memberId, newRole } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("users")
      .select("institution_id, user_type")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not authorized as institution admin" }, { status: 403 })
    }

    // Update member role
    const { error: updateError } = await supabase
      .from("institution_members")
      .update({ role: newRole })
      .eq("id", memberId)
      .eq("institution_id", adminProfile.institution_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: "Role updated successfully" })
  } catch (error: any) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 })
  }
}
