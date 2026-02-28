import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import streams from "@/lib/courses"

function getAllCourseIds() {
  const ids: string[] = []
  for (const s of streams) {
    for (const sc of s.subcourses) {
      ids.push(sc.id)
    }
  }
  return ids
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const _maybeParams: any = params
    const _resolvedParams = _maybeParams && typeof _maybeParams.then === "function" ? await _maybeParams : _maybeParams
    const batchId = _resolvedParams?.id

    if (!batchId) {
      return NextResponse.json({ error: "Missing batch id" }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(batchId)) {
      return NextResponse.json({ error: "Invalid batch id" }, { status: 400 })
    }

    const { data, error } = await supabase.from("batch_courses").select("*").eq("batch_id", batchId)

    if (error) {
      console.error("Error fetching batch courses:", error)
      return NextResponse.json({ error: "Failed to fetch batch courses" }, { status: 500 })
    }

    const allCourseIds = getAllCourseIds()
    const courses = (data || []).map((row: any) => {
      const courseId = row.course_id
      let found: any = null
      for (const s of streams) {
        const sc = s.subcourses.find((x: any) => x.id === courseId)
        if (sc) {
          found = { ...sc, streamId: s.id, streamTitle: s.title }
          break
        }
      }
      return {
        id: row.id,
        course_id: courseId,
        created_by_id: row.created_by_id,
        created_at: row.created_at,
        details: found,
      }
    })

    return NextResponse.json({ courses })
  } catch (error: any) {
    console.error("Error in batch courses GET API:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch batch courses" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { courseIds } = body

    const _maybeParams: any = params
    const _resolvedParams = _maybeParams && typeof _maybeParams.then === "function" ? await _maybeParams : _maybeParams
    const batchId = _resolvedParams?.id

    if (!batchId) {
      return NextResponse.json({ error: "Missing batch id" }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(batchId)) {
      return NextResponse.json({ error: "Invalid batch id" }, { status: 400 })
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: "No courses selected" }, { status: 400 })
    }

    // Validate course ids
    const allowed = getAllCourseIds()
    const invalid = courseIds.filter((id: string) => !allowed.includes(id))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid course ids: ${invalid.join(",")}` }, { status: 400 })
    }

    // Fetch existing courses for this batch
    const { data: existing = [] } = await supabase.from("batch_courses").select("course_id").eq("batch_id", batchId)
    const existingIds = new Set((existing as any[]).map((r: any) => r.course_id))

    const toInsert = courseIds.filter((id: string) => !existingIds.has(id)).map((id: string) => ({ batch_id: batchId, course_id: id, created_by_id: user.id }))

    if (toInsert.length === 0) {
      return NextResponse.json({ success: true, inserted: 0 })
    }

    const { data, error: insertError } = await supabase.from("batch_courses").insert(toInsert).select()

    if (insertError) {
      console.error("Error inserting batch courses:", insertError)
      return NextResponse.json({ error: "Failed to add courses to batch" }, { status: 500 })
    }

    return NextResponse.json({ success: true, inserted: data?.length || 0 })
  } catch (error: any) {
    console.error("Error in batch courses POST API:", error)
    return NextResponse.json({ error: error.message || "Failed to add courses to batch" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    const _maybeParams: any = params
    const _resolvedParams = _maybeParams && typeof _maybeParams.then === "function" ? await _maybeParams : _maybeParams
    const batchId = _resolvedParams?.id

    if (!batchId) {
      return NextResponse.json({ error: "Missing batch id" }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(batchId)) {
      return NextResponse.json({ error: "Invalid batch id" }, { status: 400 })
    }

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 })
    }

    const { error } = await supabase.from("batch_courses").delete().eq("batch_id", batchId).eq("course_id", courseId)

    if (error) {
      console.error("Error deleting batch course:", error)
      return NextResponse.json({ error: "Failed to remove course from batch" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in batch courses DELETE API:", error)
    return NextResponse.json({ error: error.message || "Failed to remove course from batch" }, { status: 500 })
  }
}
