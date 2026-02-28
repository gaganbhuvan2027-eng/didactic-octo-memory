import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { scheduleId } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[v0] start-scheduled-interview: scheduleId=', scheduleId)
    console.log('[v0] start-scheduled-interview: authenticated user=', user ? user.id : null)

    if (!user) {
      console.log('[v0] start-scheduled-interview: no authenticated user')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the scheduled interview belongs to this user
    const { data: scheduledInterview, error: fetchError } = await supabase
      .from("scheduled_interviews")
      .select("*")
      .eq("id", scheduleId)
      .eq("member_id", user.id)
      .single()

    if (fetchError || !scheduledInterview) {
      console.log('[v0] start-scheduled-interview: scheduledInterview fetch error or not found', { fetchError: fetchError?.message, scheduledInterview })
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    // If schedule is already completed, block starting it again and return latest interview id if available
    if (scheduledInterview.status === 'completed') {
      console.log('[v0] start-scheduled-interview: schedule already completed', { scheduleId })
      // Try to find the latest interview linked to this schedule
      try {
        const { data: latest, error: latestError } = await supabase
          .from('interviews')
          .select('id,status')
          .eq('scheduled_interview_id', scheduleId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestError) {
          console.error('[v0] start-scheduled-interview: error fetching latest interview for completed schedule', latestError)
          return NextResponse.json({ error: 'Schedule already completed' }, { status: 409 })
        }

        return NextResponse.json({ error: 'Schedule already completed', interviewId: latest?.id || null }, { status: 409 })
      } catch (err) {
        console.error('[v0] start-scheduled-interview: unexpected error while checking latest interview for completed schedule', err)
        return NextResponse.json({ error: 'Schedule already completed' }, { status: 409 })
      }
    }

    // If schedule is already in_progress, return the existing in-progress interview if any
    if (scheduledInterview.status === 'in_progress') {
      console.log('[v0] start-scheduled-interview: schedule already in_progress, trying to return existing interview', { scheduleId })
      try {
        const { data: existing, error: existingError } = await supabase
          .from('interviews')
          .select('id,status')
          .eq('scheduled_interview_id', scheduleId)
          .in('status', ['in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (existingError) {
          console.error('[v0] start-scheduled-interview: error fetching existing in_progress interview', existingError)
        }

        if (existing && existing.id) {
          return NextResponse.json({ success: true, alreadyStarted: true, interviewId: existing.id })
        }
        // else proceed to create a new interview session just in case
      } catch (err) {
        console.error('[v0] start-scheduled-interview: unexpected error while checking in_progress interview', err)
      }
    }
    // Create a new interview session and link to the scheduled interview
    let interview: any = null
    try {
      const insertRes = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          interview_type: scheduledInterview.course,
          difficulty: scheduledInterview.difficulty,
          status: "in_progress",
          scheduled_interview_id: scheduleId,
        })
        .select()
        .single()

      if (insertRes.error) throw insertRes.error
      interview = insertRes.data
    } catch (err: any) {
      // Defensive fallback: if the DB schema hasn't been migrated yet (column missing / schema cache), retry without the column
      console.warn('[v0] start-scheduled-interview: insert with scheduled_interview_id failed, retrying without that column:', err?.message || err)
      const fallbackRes = await supabase
        .from("interviews")
        .insert({
          user_id: user.id,
          interview_type: scheduledInterview.course,
          difficulty: scheduledInterview.difficulty,
          status: "in_progress",
        })
        .select()
        .single()

      if (fallbackRes.error) {
        throw fallbackRes.error
      }

      interview = fallbackRes.data
    }

    // Update scheduled interview status to in_progress
    await supabase
      .from("scheduled_interviews")
      .update({ status: "in_progress" })
      .eq("id", scheduleId)

    return NextResponse.json({ 
      success: true, 
      interviewId: interview.id,
      interviewType: scheduledInterview.course,
      difficulty: scheduledInterview.difficulty,
      scheduledDate: scheduledInterview.scheduled_date,
      deadline: scheduledInterview.deadline || null,
      topic: scheduledInterview.course,
      duration: scheduledInterview.duration || 30,
    })
  } catch (error: any) {
    console.error("Error starting scheduled interview:", error)
    return NextResponse.json({ error: error.message || "Failed to start interview" }, { status: 500 })
  }
}
