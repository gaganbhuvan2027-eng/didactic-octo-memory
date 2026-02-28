import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import InstitutionDashboardContent from "@/components/institution-dashboard-content"
import InstitutionNavbar from "@/components/institution-navbar"

export default async function InstitutionDashboardPage() {
  console.log("[v0] ========================================")
  console.log("[v0] Institution dashboard page STARTING...")
  console.log("[v0] ========================================")

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  )

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] User check:", user ? `Found user ${user.id}` : "No user found")

  if (!user) {
    console.log("[v0] No authenticated user, redirecting to /auth")
    redirect("/auth")
  }

  // Get user profile to check if they're institution admin
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("user_type, institution_id")
    .eq("id", user.id)
    .single()

  console.log("[v0] User profile query result:", { userProfile, profileError })

  // Ensure only institution admins can access this page
  if (!userProfile || userProfile.user_type !== "institution_admin") {
    console.log("[v0] User is not institution admin, redirecting to /dashboard")
    console.log("[v0] User type:", userProfile?.user_type || "null")
    redirect("/dashboard")
  }

  console.log("[v0] ✓ Institution admin verified!")
  console.log("[v0] Loading institution data...")

  // Get institution details
  const { data: institution } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", userProfile.institution_id)
    .single()

  console.log("[v0] Institution loaded:", institution?.name || "null")

  // Get all members of the institution
  const { data: members } = await supabase
    .from("institution_members")
    .select("*, users:user_id(id, email, name)")
    .eq("institution_id", userProfile.institution_id)
    .order("joined_at", { ascending: false })

  console.log("[v0] Members loaded:", members?.length || 0)
  console.log("[v0] Rendering institution dashboard component...")

  return (
    <div className="min-h-screen bg-white">
      <InstitutionNavbar />
      <InstitutionDashboardContent
        institutionId={userProfile.institution_id}
        institutionName={institution?.name || "Institution"}
      />
    </div>
  )
}
