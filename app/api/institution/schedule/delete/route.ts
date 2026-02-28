import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { scheduleId } = await request.json()

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
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from("scheduled_interviews")
      .delete()
      .eq("id", scheduleId)
      .eq("institution_id", adminProfile.institution_id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, message: "Schedule deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json({ error: error.message || "Failed to delete schedule" }, { status: 500 })
  }
}
