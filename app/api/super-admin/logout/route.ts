import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { destroySession } from "@/lib/super-admin-auth"

export async function POST() {
  try {
    // Get the session token and destroy it
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("super_admin_session")?.value
    
    if (sessionToken) {
      destroySession(sessionToken)
      console.log("[super-admin/logout] Session destroyed")
    }
    
    const response = NextResponse.json({ success: true })
    
    // Clear the session cookie
    response.cookies.set("super_admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
    })
    
    return response
  } catch (error) {
    console.error("[super-admin/logout] Error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}

