import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { memberId, course, difficulty, scheduledDate, deadline, duration } = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile } = await supabase
      .from("users")
      .select("institution_id, user_type")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const durationVal = Math.max(5, Math.min(180, Number(duration) || 30))

    // Log incoming request for easier debugging
    console.log('[v0] schedule/create: body=', { memberId, course, difficulty, scheduledDate, deadline, duration })
    console.log('[v0] schedule/create: admin=', { id: user.id, institution_id: adminProfile.institution_id })

    // Try inserting with duration. If DB does not have the column (migration not applied),
    // retry without the duration field as a compatibility fallback.
    const { error: insertError } = await supabase.from("scheduled_interviews").insert({
      institution_id: adminProfile.institution_id,
      scheduled_by_id: user.id,
      member_id: memberId,
      course,
      difficulty,
      scheduled_date: scheduledDate,
      deadline: deadline || null,
      duration: durationVal,
      status: "pending",
    })

    if (insertError) {
      console.error('[v0] schedule/create: insert error (first attempt)=', insertError)

      const message = (insertError?.message || insertError?.details || JSON.stringify(insertError) || '').toString()
      if (/duration|column.*does not exist/i.test(message)) {
        // Attempt fallback insert without duration
        console.warn('[v0] schedule/create: retrying insert without duration (migration may be pending)')
        const { error: retryError } = await supabase.from("scheduled_interviews").insert({
          institution_id: adminProfile.institution_id,
          scheduled_by_id: user.id,
          member_id: memberId,
          course,
          difficulty,
          scheduled_date: scheduledDate,
          deadline: deadline || null,
          status: "pending",
        })

        if (retryError) {
          console.error('[v0] schedule/create: retry insert failed=', retryError)
          throw retryError
        }

        console.log('[v0] schedule/create: scheduled interview created (fallback, no duration)')
        return NextResponse.json({ success: true, message: "Interview scheduled successfully (no duration column)" })
      }

      throw insertError
    }

    return NextResponse.json({ success: true, message: "Interview scheduled successfully" })
  } catch (error: any) {
    console.error("Error scheduling interview:", error)
    return NextResponse.json({ error: error.message || "Failed to schedule interview" }, { status: 500 })
  }
}
