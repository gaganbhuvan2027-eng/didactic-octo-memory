import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createRestClient } from "@/lib/supabase/rest-client"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function POST(request: Request) {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { institutionId, emails } = await request.json()

    if (!institutionId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: "Invalid request: institutionId and emails array required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verify institution exists
    const { data: institution } = await supabase
      .from("institutions")
      .select("id")
      .eq("id", institutionId)
      .single()

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 })
    }

    const results = {
      success: [] as string[],
      failed: [] as Array<{ email: string; reason: string }>,
    }

    // Process each email
    for (const email of emails) {
      if (!email || typeof email !== "string" || !email.includes("@")) {
        results.failed.push({ email, reason: "Invalid email format" })
        continue
      }

      try {
        // Find or create user by email
        const restClient = createRestClient({ useServiceRole: true })
        const { data: authUsers } = await restClient.auth.admin.listUsers()
        const existingAuthUser = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

        let userId: string

        if (existingAuthUser) {
          userId = existingAuthUser.id
          // Ensure user exists in public.users table
          await supabase
            .from("users")
            .upsert(
              {
                id: userId,
                email: email.toLowerCase(),
                name: email.split("@")[0],
              },
              { onConflict: "id" },
            )
        } else {
          // Create new auth user
          const { data: newUser, error: createError } = await restClient.auth.admin.createUser({
            email: email.toLowerCase(),
            password: Math.random().toString(36).slice(-12), // Generate random password
            email_confirm: true,
            user_metadata: {
              name: email.split("@")[0],
            },
          })

          if (createError || !newUser?.user) {
            results.failed.push({ email, reason: createError?.message || "Failed to create user" })
            continue
          }

          userId = newUser.user.id
        }

        // Check if already a member
        const { data: existingMember } = await supabase
          .from("institution_members")
          .select("id")
          .eq("institution_id", institutionId)
          .eq("user_id", userId)
          .maybeSingle()

        if (existingMember) {
          results.success.push(email) // Already a member, count as success
        } else {
          // Add to institution_members
          const { error: memberError } = await supabase.from("institution_members").insert({
            institution_id: institutionId,
            user_id: userId,
            role: "member",
          })

          if (memberError) {
            results.failed.push({ email, reason: memberError.message })
          } else {
            results.success.push(email)
          }
        }
      } catch (err: any) {
        results.failed.push({ email, reason: err.message || "Unknown error" })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: emails.length,
        successful: results.success.length,
        failed: results.failed.length,
      },
    })
  } catch (error: any) {
    console.error("Error in bulk upload:", error)
    return NextResponse.json({ error: error.message || "Failed to process bulk upload" }, { status: 500 })
  }
}

