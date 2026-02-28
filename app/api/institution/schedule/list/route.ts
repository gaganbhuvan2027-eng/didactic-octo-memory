import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const requestedInstId = url.searchParams.get('institutionId') || undefined

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch the user's profile to know their institution and role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('institution_id, user_type')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[v0] schedule/list - profile fetch error', profileError)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }

    const institutionId = requestedInstId || profile?.institution_id
    if (!institutionId) {
      return NextResponse.json({ error: 'No institution specified' }, { status: 400 })
    }

    // Allow access if requester belongs to the institution or is an institution_admin
    if (profile.institution_id !== institutionId && profile.user_type !== 'institution_admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data: scheduledInterviews, error } = await supabase
      .from("scheduled_interviews")
      .select(
        `
        *,
        member:member_id(id, name, email),
        scheduled_by:scheduled_by_id(name)
      `,
      )
      .eq("institution_id", institutionId)
      .order("scheduled_date", { ascending: true })

    if (error) throw error

    return NextResponse.json({ interviews: scheduledInterviews || [] })
  } catch (error: any) {
    console.error("Error fetching scheduled interviews:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch interviews" }, { status: 500 })
  }
}
