import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

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

    // Fetch batch with members and join_code
    const { data: batch, error: batchError } = await supabase
      .from("batches")
      .select(`
        *,
        batch_members (
          id,
          user_id,
          added_at,
          user:user_id (
            name,
            email
          )
        ),
        join_code
      `)
      .eq("id", batchId)
      .single()

    if (batchError) {
      console.error("Error fetching batch:", batchError)
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    return NextResponse.json({ batch })
  } catch (error: any) {
    console.error("Error in get batch API:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch batch" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()
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

    // Update batch
    const { data: batch, error: updateError } = await supabase
      .from("batches")
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq("id", batchId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating batch:", updateError)
      return NextResponse.json({ error: "Failed to update batch" }, { status: 500 })
    }

    return NextResponse.json({ batch })
  } catch (error: any) {
    console.error("Error in update batch API:", error)
    return NextResponse.json({ error: error.message || "Failed to update batch" }, { status: 500 })
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

    // Delete batch (cascade will handle batch_members)
    const { error: deleteError } = await supabase.from("batches").delete().eq("id", batchId)

    if (deleteError) {
      console.error("Error deleting batch:", deleteError)
      return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in delete batch API:", error)
    return NextResponse.json({ error: error.message || "Failed to delete batch" }, { status: 500 })
  }
}
