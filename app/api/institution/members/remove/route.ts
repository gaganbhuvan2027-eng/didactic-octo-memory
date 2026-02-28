import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { memberId } = await request.json()

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

    // Remove member
    const { error: deleteError } = await supabase
      .from("institution_members")
      .delete()
      .eq("id", memberId)
      .eq("institution_id", adminProfile.institution_id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, message: "Member removed successfully" })
  } catch (error: any) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: error.message || "Failed to remove member" }, { status: 500 })
  }
}
