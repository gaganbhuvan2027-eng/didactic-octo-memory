import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function GET(request: Request, { params }: { params: { institutionId: string } }) {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { institutionId } = await params
    const supabase = await createAdminClient()

    // Get all batches for the institution
    const { data: batches, error } = await supabase
      .from("batches")
      .select(`
        id,
        name,
        description,
        join_code,
        created_at,
        created_by_id
      `)
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get member counts for each batch
    const batchesWithStats = await Promise.all(
      (batches || []).map(async (batch) => {
        const { count: memberCount } = await supabase
          .from("batch_members")
          .select("*", { count: "exact", head: true })
          .eq("batch_id", batch.id)

        // Get creator name
        let creatorName = "Unknown"
        if (batch.created_by_id) {
          const { data: creator } = await supabase
            .from("users")
            .select("name, email")
            .eq("id", batch.created_by_id)
            .single()
          creatorName = creator?.name || creator?.email || "Unknown"
        }

        return {
          ...batch,
          member_count: memberCount || 0,
          creator_name: creatorName,
        }
      })
    )

    return NextResponse.json({ batches: batchesWithStats })
  } catch (error: any) {
    console.error("Error fetching institution batches:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch batches" }, { status: 500 })
  }
}
