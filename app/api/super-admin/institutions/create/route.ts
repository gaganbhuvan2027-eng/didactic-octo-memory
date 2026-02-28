import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifySuperAdminRequest } from "@/lib/super-admin-middleware"

export async function POST(request: Request) {
  // Verify super admin authentication and rate limit
  const auth = await verifySuperAdminRequest(request)
  if (!auth.authorized) {
    return auth.error
  }

  try {
    const { name, email_domain } = await request.json()

    if (!name || !email_domain) {
      return NextResponse.json({ error: "Name and email_domain are required" }, { status: 400 })
    }

    const adminSupabase = await createAdminClient()

    const { data, error } = await adminSupabase.from("institutions").insert([
      { name, email_domain: email_domain.toLowerCase() }
    ]).select()

    if (error) {
      console.error("Error creating institution:", error)
      return NextResponse.json({ error: error.message || "Failed to create institution" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Institution created successfully",
      institution: data[0],
    }, { status: 200 })

  } catch (error: any) {
    console.error("Unhandled error creating institution:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
