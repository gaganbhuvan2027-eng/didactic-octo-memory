import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get('interviewId')
    if (!interviewId) return NextResponse.json({ error: 'interviewId is required' }, { status: 400 })

    const supabase = await createAdminClient()
    const { data, error } = await supabase
      .from('interviews')
      .select('id, interview_type, user_id, status, started_at, finished_at')
      .eq('id', interviewId)
      .maybeSingle()

    if (error) {
      console.error('[v0] debug/interview-row: error fetching interview row:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ interview: data })
  } catch (err) {
    console.error('[v0] debug/interview-row: unexpected error', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
