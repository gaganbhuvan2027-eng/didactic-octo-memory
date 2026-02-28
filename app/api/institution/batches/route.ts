import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log('[api/institution/batches] supabase.auth.getUser ->', { user: user ? { id: user.id, email: user.email } : null })

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

    // Get all batches for the institution
    const { data: batches, error: batchesError } = await supabase
      .from("batches")
      .select(
        `
        *,
        created_by:created_by_id (name, email),
        batch_members (id, user_id)
      `,
      )
      .eq("institution_id", adminProfile.institution_id)
      .order("created_at", { ascending: false })

    if (batchesError) {
      console.error("Error fetching batches:", batchesError)
      // If table doesn't exist, return 404 with specific code
      if (batchesError.code === 'PGRST204' || batchesError.message?.includes('batches')) {
        return NextResponse.json({ 
          batches: [],
          code: 'PGRST205',
          message: batchesError.message 
        }, { status: 404 })
      }
      return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 })
    }

    // Add member count to each batch
    const batchesWithCount = batches?.map((batch: any) => ({
      ...batch,
      member_count: batch.batch_members?.length || 0,
    }))

    return NextResponse.json({ batches: batchesWithCount || [] })
  } catch (error: any) {
    console.error("Error in batches API:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to fetch batches",
      code: error.code,
      batches: []
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

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

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Batch name is required" }, { status: 400 })
    }

    const joinCode = generateJoinCode()

    // Create new batch
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .insert({
        institution_id: adminProfile.institution_id,
        name,
        description,
        created_by_id: user.id,
        join_code: joinCode,
      })
      .select()
      .single()

    if (batchError) {
      if (batchError.code === "23505") {
        return NextResponse.json({ error: "A batch with this name already exists" }, { status: 400 })
      }
      console.error("Error creating batch:", batchError)
      return NextResponse.json({ error: "Failed to create batch" }, { status: 500 })
    }

    return NextResponse.json({ batch })
  } catch (error: any) {
    console.error("Error in create batch API:", error)
    return NextResponse.json({ error: error.message || "Failed to create batch" }, { status: 500 })
  }
}
