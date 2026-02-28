import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const scheduleId = url.searchParams.get('scheduleId')
    if (!scheduleId) return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify requester is related to this schedule (member or scheduled_by)
    const { data: schedule, error: scheduleError } = await supabase
      .from('scheduled_interviews')
      .select('id, member_id, scheduled_by_id')
      .eq('id', scheduleId)
      .maybeSingle()

    if (scheduleError) {
      console.error('[v0] schedule-result: fetch error', scheduleError)
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }

    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })

    if (schedule.member_id !== user.id && schedule.scheduled_by_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id,status')
      .eq('scheduled_interview_id', scheduleId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (interviewError) {
      console.error('[v0] schedule-result: interview query error', interviewError)
      return NextResponse.json({ error: 'Failed to fetch interview' }, { status: 500 })
    }

    // Return both the latest interview id (if any) and schedule metadata
    return NextResponse.json({ interviewId: interview?.id || null, interviewStatus: interview?.status || null, scheduleStatus: schedule.status || null, batchId: schedule.batch_id || null })
  } catch (error: any) {
    console.error('[v0] schedule-result: unexpected error', error)
    return NextResponse.json({ error: error.message || 'Unexpected error' }, { status: 500 })
  }
}
