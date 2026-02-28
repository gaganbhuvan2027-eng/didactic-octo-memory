import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { batchId: string } }) {
  const { batchId } = params
  try {
    const body = await request.json()
    const amount = body.amount

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount provided" }, { status: 400 })
    }

    // Authenticate current user and ensure they are institution_admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: adminProfile, error: profileError } = await supabase
      .from("users")
      .select("institution_id, user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const institutionId = adminProfile.institution_id

    // Ensure batch belongs to this institution
    const { data: batchRow, error: batchError } = await supabase
      .from("batches")
      .select("id, institution_id")
      .eq("id", batchId)
      .single()

    if (batchError || !batchRow || batchRow.institution_id !== institutionId) {
      return NextResponse.json({ error: "Batch not found or does not belong to your institution" }, { status: 404 })
    }

    // Call the server-side SQL function to perform atomic distribution. Use admin client to run with sufficient privileges.
    const supabaseAdmin = await createAdminClient()

    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc("distribute_credits_to_batch", {
      p_batch_id: batchId,
      p_amount_per_member: amount,
      p_performed_by: user.id,
    })

    if (rpcError) {
      console.error("distribute rpc error:", rpcError)
      return NextResponse.json({ error: rpcError.message || "Distribution failed" }, { status: 500 })
    }

    // rpcResult might be a json with success flag
    return NextResponse.json(rpcResult)
  } catch (error: any) {
    console.error("Error in distribute endpoint:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
