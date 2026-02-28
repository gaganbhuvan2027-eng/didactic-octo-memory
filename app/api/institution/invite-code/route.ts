import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
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

    // Get user profile to check if they're an institution admin
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("user_type, institution_id")
      .eq("id", user.id)
      .single()

    if (profileError || userProfile?.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not an institution admin" }, { status: 403 })
    }

    const { data: institution, error: institutionError } = await supabase
      .from("institutions")
      .select("id, name")
      .eq("id", userProfile.institution_id)
      .single()

    if (institutionError) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 })
    }

    try {
      const { data: inviteCodeData, error: inviteCodeError } = await supabase
        .from("institutions")
        .select("invite_code")
        .eq("id", userProfile.institution_id)
        .single()

      if (inviteCodeError) {
        const errorMessage = inviteCodeError.message || ""
        const errorCode = (inviteCodeError as any).code || ""

        if (errorCode === "42703" || errorMessage.includes("does not exist") || errorMessage.includes("invite_code")) {
          return NextResponse.json({
            needsMigration: true,
            message: "Please run the SQL script: scripts/006_add_institution_invite_code.sql",
          })
        }
        throw inviteCodeError
      }

      // If no invite code exists, generate one
      if (!inviteCodeData?.invite_code) {
        const inviteCode = generateInviteCode()
        const { error: updateError } = await supabase
          .from("institutions")
          .update({ invite_code: inviteCode })
          .eq("id", institution.id)

        if (updateError) {
          return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 })
        }

        return NextResponse.json({ inviteCode })
      }

      return NextResponse.json({ inviteCode: inviteCodeData.invite_code })
    } catch (dbError: any) {
      console.error("[v0] Database error when fetching invite_code:", dbError)

      const errorMessage = dbError?.message || ""
      const errorCode = dbError?.code || ""

      if (errorCode === "42703" || errorMessage.includes("does not exist") || errorMessage.includes("invite_code")) {
        return NextResponse.json({
          needsMigration: true,
          message: "Please run the SQL script: scripts/006_add_institution_invite_code.sql",
        })
      }

      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("[v0] Error in invite code API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
