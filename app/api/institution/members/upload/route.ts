import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Note: This route requires the following npm packages:
// - xlsx (sheetjs)
// - pdf-parse
// Install them in your project before using: npm install xlsx pdf-parse

function extractEmailsFromText(text: string) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  const matches = text.match(emailRegex)
  if (!matches) return []
  // Normalize and dedupe
  const unique = Array.from(new Set(matches.map((m) => m.toLowerCase())))
  return unique
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Support testing: allow bypass with service role key + x-institution-id header
    const authHeader = (request.headers.get('authorization') || '')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let institutionId: string | null = null

    if (authHeader.startsWith('Bearer ') && authHeader.slice(7) === serviceRoleKey) {
      // Service key used — require x-institution-id header to specify the target institution
      institutionId = request.headers.get('x-institution-id')
      if (!institutionId) {
        return NextResponse.json({ error: 'Missing x-institution-id header for service key access' }, { status: 400 })
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

      // Check admin institution
      const { data: adminProfile } = await supabase.from("users").select("institution_id, user_type").eq("id", user.id).single()
      if (!adminProfile || adminProfile.user_type !== "institution_admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
      }

      institutionId = adminProfile.institution_id
    }

    const form = await request.formData()
    const file = form.get("file") as any
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const filename = file.name || "upload"
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let emails: string[] = []

    const lower = filename.toLowerCase()
    if (lower.endsWith(".csv") || file.type === "text/csv" || lower.endsWith(".txt")) {
      const text = buffer.toString("utf-8")
      emails = extractEmailsFromText(text)
    } else if (lower.endsWith(".pdf") || file.type === "application/pdf") {
      const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'))
      const pdf = await pdfParse(buffer)
      emails = extractEmailsFromText(pdf.text)
    } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
      const xlsx = await import('xlsx')
      const workbook = xlsx.read(buffer, { type: "buffer" })
      let text = ""
      workbook.SheetNames.forEach((sheetName: string) => {
        const ws = workbook.Sheets[sheetName]
        const sheetText = xlsx.utils.sheet_to_csv(ws) || ""
        text += "\n" + sheetText
      })
      emails = extractEmailsFromText(text)
    } else {
      // Fallback to trying CSV parse
      const text = buffer.toString("utf-8")
      emails = extractEmailsFromText(text)
    }

    if (!emails.length) {
      return NextResponse.json({ error: "No email addresses found in file" }, { status: 400 })
    }

    // Get user rows for these emails
    const { data: users } = await supabase.from("users").select("id,email").in("email", emails)

    const usersList = users || []
    const foundEmails = usersList.map((u: any) => u.email.toLowerCase())
    const notFound = emails.filter((e) => !foundEmails.includes(e.toLowerCase()))

    // For found users, check existing institution_members
    const userIds = usersList.map((u: any) => u.id)

    // Determine institution ID to use for membership checks (from admin session or service key header)
    const targetInstitutionId = institutionId || adminProfile?.institution_id

    // If preview requested, return lists without inserting
    const url = new URL(request.url)
    if (url.searchParams.get('preview') === '1') {
      let existingUserIds: string[] = []
      if (userIds.length > 0) {
        const { data: existingMembers } = await supabase
          .from("institution_members")
          .select("user_id")
          .eq("institution_id", targetInstitutionId)
          .in("user_id", userIds)

        existingUserIds = (existingMembers || []).map((m: any) => m.user_id)
      }

      const alreadyMembers = usersList.filter((u: any) => existingUserIds.includes(u.id)).map((u: any) => u.email)
      const found = usersList.map((u: any) => u.email)

      return NextResponse.json({ found, notFound, alreadyMembers })
    }

    if (userIds.length === 0) {
      return NextResponse.json({ added: [], notFound, skipped: [] })
    }

    const { data: existingMembers } = await supabase
      .from("institution_members")
      .select("user_id")
      .eq("institution_id", targetInstitutionId)
      .in("user_id", userIds)

    const existingUserIds = (existingMembers || []).map((m: any) => m.user_id)

    const toAdd = usersList.filter((u: any) => !existingUserIds.includes(u.id))

    const added: string[] = []
    const skipped: any[] = []

    if (toAdd.length > 0) {
      const inserts = toAdd.map((u: any) => ({
        user_id: u.id,
        institution_id: targetInstitutionId,
        role: "member",
        joined_at: new Date().toISOString(),
      }))

      const { data: insertData, error: insertError } = await supabase.from("institution_members").insert(inserts).select()

      if (insertError) {
        console.error("Error inserting members:", insertError)
        return NextResponse.json({ error: "Failed to add members" }, { status: 500 })
      }

      // Update users.institution_id for added users
      const idsToUpdate = toAdd.map((u: any) => u.id)
      const { error: updateError } = await supabase.from("users").update({ institution_id: targetInstitutionId }).in("id", idsToUpdate)
      if (updateError) console.error("Error updating users.institution_id:", updateError)

      added.push(...toAdd.map((u: any) => u.email))
    }

    // Skipped are those already existing
    skipped.push(...usersList.filter((u: any) => existingUserIds.includes(u.id)).map((u: any) => ({ email: u.email, reason: "already a member" })))

    return NextResponse.json({ added, notFound, skipped })
  } catch (error: any) {
    console.error("Error processing upload:", error)
    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 })
  }
}
