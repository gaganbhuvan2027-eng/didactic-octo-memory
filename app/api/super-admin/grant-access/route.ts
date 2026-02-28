import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createRestClient } from "@/lib/supabase/rest-client"

/**
 * This endpoint allows granting super admin access to a user
 * It requires a secret key in the environment for security
 */
export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json()

    // Check secret key
    const requiredSecret = process.env.SUPERADMIN_SECRET_KEY || "change-this-secret-key"
    if (secret !== requiredSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const restClient = createRestClient({ useServiceRole: true })

    // Find user by email
    const { data: authUsers } = await restClient.auth.admin.listUsers()
    const user = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user metadata to add super_admin role
    const { data: updatedUser, error: updateError } = await restClient.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: "super_admin",
        },
      },
    )

    if (updateError || !updatedUser) {
      console.error("Error updating user:", updateError)
      return NextResponse.json({ error: updateError?.message || "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Super admin access granted to ${email}`,
      userId: user.id,
    })
  } catch (error: any) {
    console.error("Error granting super admin access:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

