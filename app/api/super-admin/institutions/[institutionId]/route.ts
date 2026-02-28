import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function GET(request: Request, { params }: { params: { institutionId: string } }) {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { institutionId } = await params
    const supabase = await createAdminClient()

    // Get institution details
    const { data: institution, error: instError } = await supabase
      .from("institutions")
      .select("*")
      .eq("id", institutionId)
      .single()

    if (instError) throw instError
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 })
    }

    // Get member count
    const { count: memberCount } = await supabase
      .from("institution_members")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId)

    // Get batch count
    const { count: batchCount } = await supabase
      .from("batches")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId)

    // Get admin users
    const { data: admins } = await supabase
      .from("institution_members")
      .select("user_id, role, joined_at")
      .eq("institution_id", institutionId)
      .eq("role", "admin")

    const adminIds = admins?.map((a) => a.user_id) || []
    const { data: adminUsers } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", adminIds)

    // Get usage stats
    const { data: usage } = await supabase
      .from("institution_usage")
      .select("credits_used, groq_calls")
      .eq("institution_id", institutionId)

    const totalCreditsUsed = usage?.reduce((sum, u) => sum + u.credits_used, 0) || 0
    const totalGroqCalls = usage?.reduce((sum, u) => sum + u.groq_calls, 0) || 0

    // Get credit balance
    const { data: creditData } = await supabase
      .from("institution_credits")
      .select("balance")
      .eq("institution_id", institutionId)
      .maybeSingle()

    // Get scheduled interviews count
    const { count: scheduledCount } = await supabase
      .from("scheduled_interviews")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", institutionId)

    return NextResponse.json({
      institution: {
        ...institution,
        member_count: memberCount || 0,
        batch_count: batchCount || 0,
        credits_used: totalCreditsUsed,
        groq_calls: totalGroqCalls,
        balance: creditData?.balance || 0,
        scheduled_interviews_count: scheduledCount || 0,
        admins: adminUsers || [],
      },
    })
  } catch (error: any) {
    console.error("Error fetching institution details:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch institution" }, { status: 500 })
  }
}

// Update institution settings
export async function PATCH(request: Request, { params }: { params: { institutionId: string } }) {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { institutionId } = await params
    const body = await request.json()
    const { name, email_domain, is_active } = body

    const supabase = await createAdminClient()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email_domain !== undefined) updateData.email_domain = email_domain
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: institution, error } = await supabase
      .from("institutions")
      .update(updateData)
      .eq("id", institutionId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ institution })
  } catch (error: any) {
    console.error("Error updating institution:", error)
    return NextResponse.json({ error: error.message || "Failed to update institution" }, { status: 500 })
  }
}

// Delete institution (soft delete by setting is_active = false)
export async function DELETE(request: Request, { params }: { params: { institutionId: string } }) {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { institutionId } = await params
    const supabase = await createAdminClient()

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from("institutions")
      .update({ is_active: false })
      .eq("id", institutionId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Institution deactivated" })
  } catch (error: any) {
    console.error("Error deleting institution:", error)
    return NextResponse.json({ error: error.message || "Failed to delete institution" }, { status: 500 })
  }
}
