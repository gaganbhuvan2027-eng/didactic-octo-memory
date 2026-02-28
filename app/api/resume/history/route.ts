import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[resume-history] Fetching scans for user:", user.id)

    const { data: scans, error } = await supabase
      .from("resume_scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      console.error("[resume-history] Error fetching resume history:", error)
      // Return empty array instead of error to avoid breaking the UI
      return NextResponse.json({ scans: [], error: error.message })
    }

    console.log("[resume-history] Found", scans?.length || 0, "scans")
    return NextResponse.json({ scans: scans || [] })
  } catch (error: any) {
    console.error("[resume-history] Error in resume history:", error)
    return NextResponse.json({ scans: [], error: error.message || "An unexpected error occurred" })
  }
}

