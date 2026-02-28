import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function GET(request: Request) {
  try {
    console.log("[/api/super-admin/users] - Checking super admin access...")
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      console.log("[/api/super-admin/users] - Unauthorized access attempt.")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "1000")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabase = await createAdminClient()
    console.log("[/api/super-admin/users] - Supabase admin client created.")

    let query = supabase.from("users").select("id, email, name, created_at").order("created_at", { ascending: false })

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7b85b57d-d53d-4000-9ec2-d7db075b5f8a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/super-admin/users/route.ts:31',message:'GET /users - Executing users query',timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'U'})}).catch(()=>{});
    // #endregion
    const { data: users, error } = await query
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7b85b57d-d53d-4000-9ec2-d7db075b5f8a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/super-admin/users/route.ts:33',message:'GET /users - Users query completed',data:{users: users, error: error?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'U'})}).catch(()=>{});
    // #endregion

    if (error) throw error

    // Get credit balances for all users
    const userIds = users?.map((u) => u.id) || []
    console.log("[/api/super-admin/users] - Fetching credit balances for user IDs:", userIds)
    const { data: credits } = await supabase
      .from("user_credits")
      .select("user_id, balance")
      .in("user_id", userIds)
    console.log("[/api/super-admin/users] - Credit balances fetched.", { credits })

    const creditsMap = new Map(credits?.map((c) => [c.user_id, c.balance]) || [])

    const usersWithCredits = users?.map((user) => ({
      ...user,
      balance: creditsMap.get(user.id) || 0,
    }))
    console.log("[/api/super-admin/users] - Returning users with credits.")

    return NextResponse.json({ users: usersWithCredits || [] })
  } catch (error: any) {
    console.error("[/api/super-admin/users] - Error fetching users:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 })
  }
}

