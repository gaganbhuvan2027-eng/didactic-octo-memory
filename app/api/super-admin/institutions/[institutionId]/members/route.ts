import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function GET(request: Request, { params }: { params: { institutionId: string } }) {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Get all members of the institution
    const { data: members, error } = await supabase
      .from("institution_members")
      .select("id, user_id, role, joined_at")
      .eq("institution_id", params.institutionId)
      .order("joined_at", { ascending: false })

    if (error) throw error

    // Get user details and credit balances
    const userIds = members?.map((m) => m.user_id) || []
    const { data: users } = await supabase
      .from("users")
      .select("id, email, name")
      .in("id", userIds)

    const { data: credits } = await supabase
      .from("user_credits")
      .select("user_id, balance")
      .in("user_id", userIds)

    const usersMap = new Map(users?.map((u) => [u.id, u]) || [])
    const creditsMap = new Map(credits?.map((c) => [c.user_id, c.balance]) || [])

    const membersWithDetails = members?.map((member) => {
      const user = usersMap.get(member.user_id)
      return {
        ...member,
        email: user?.email || "unknown",
        name: user?.name || "unknown",
        balance: creditsMap.get(member.user_id) || 0,
      }
    })

    return NextResponse.json({ members: membersWithDetails || [] })
  } catch (error: any) {
    console.error("Error fetching members:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch members" }, { status: 500 })
  }
}

