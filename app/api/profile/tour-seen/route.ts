import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ seen: false })
    }
    const { data } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle()
    const prefs = (data?.preferences as { interview_tour_seen?: boolean }) || {}
    return NextResponse.json({ seen: !!prefs.interview_tour_seen })
  } catch {
    return NextResponse.json({ seen: false })
  }
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { data: existing } = await supabase
      .from("users")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle()
    const prefs = (existing?.preferences as Record<string, unknown>) || {}
    const { error } = await supabase
      .from("users")
      .update({ preferences: { ...prefs, interview_tour_seen: true } })
      .eq("id", user.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[tour-seen] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
