import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type (PDF, DOC, DOCX)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload PDF, DOC, or DOCX" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB" }, { status: 400 })
    }

    // Delete old resume if exists
    const { data: userData } = await supabase.from("users").select("resume_url").eq("id", user.id).single()

    if (userData?.resume_url) {
      try {
        const { del } = await import("@vercel/blob")
        await del(userData.resume_url)
      } catch (error) {
        console.error("[v0] Error deleting old resume:", error)
      }
    }

    // Upload to Vercel Blob with user-specific path
    const blob = await put(`resumes/${user.id}/${file.name}`, file, {
      access: "public",
    })

    console.log("[v0] Resume uploaded to Blob:", blob.url)

    // Update user profile with resume URL
    const { error: updateError } = await supabase.from("users").update({ resume_url: blob.url }).eq("id", user.id)

    if (updateError) {
      console.error("[v0] Error updating user profile:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("[v0] Resume upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
