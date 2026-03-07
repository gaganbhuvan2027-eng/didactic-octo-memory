import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import DashboardNavbar from "@/components/dashboard-navbar"
import { DashboardStats } from "@/components/dashboard-stats"
import { ScheduledInterviewsSection } from "@/components/scheduled-interviews-section"
import { DashboardInterviews } from "@/components/dashboard-interviews"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth")
  }

  let { data: userProfile } = await supabase
    .from("users")
    .select("preferences, user_type")
    .eq("id", user.id)
    .maybeSingle()

  // Fallback: if not found (RLS/timing), try admin client
  if (!userProfile) {
    const admin = await createAdminClient()
    const { data } = await admin.from("users").select("preferences, user_type").eq("id", user.id).maybeSingle()
    userProfile = data
  }

  // If user doesn't exist in the database, create their profile
  if (!userProfile) {
    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      created_at: new Date().toISOString(),
      preferences: { onboarding_completed: true },
    })

    if (!insertError) {
      userProfile = { preferences: { onboarding_completed: true }, user_type: "user" }
    } else {
      // Insert failed (e.g. duplicate) - refetch with admin
      const admin = await createAdminClient()
      const { data } = await admin.from("users").select("preferences, user_type").eq("id", user.id).maybeSingle()
      userProfile = data
    }
  }

  const userType = userProfile?.user_type as string
  const userName = user.user_metadata?.name || user.email?.split("@")[0] || "User"

  // Institution users go to institution dashboard
  if (userType === "institution") {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-20 md:pt-24 pb-8 md:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">Welcome back, {userName}</h1>
          <p className="text-base md:text-lg text-gray-600">You are logged in as an institution user.</p>
          <p className="text-base md:text-lg text-gray-600"><Link href="/institution-dashboard">Go to Institution Dashboard</Link></p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Welcome back, {userName}</h1>
          <p className="text-lg text-gray-600">Choose how you want to prepare for your next interview</p>
        </div>

        {/* Stats Section - Server Component */}
        <DashboardStats />

        {/* Scheduled Interviews Section - Server Component */}
        <ScheduledInterviewsSection />

        {/* Quick Actions */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/history">
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <p className="text-sm font-semibold text-gray-900 mb-1">📋 History</p>
              <p className="text-xs text-gray-600">Past interviews</p>
            </Card>
          </Link>
          <Link href="/performance">
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <p className="text-sm font-semibold text-gray-900 mb-1">📊 Performance</p>
              <p className="text-xs text-gray-600">Track progress</p>
            </Card>
          </Link>
          <Link href="/leaderboard">
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <p className="text-sm font-semibold text-gray-900 mb-1">🏆 Leaderboard</p>
              <p className="text-xs text-gray-600">Compare rank</p>
            </Card>
          </Link>
          <Link href="/my-institute">
            <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <p className="text-sm font-semibold text-gray-900 mb-1">🏫 Institute</p>
              <p className="text-xs text-gray-600">Your institute</p>
            </Card>
          </Link>
        </div>

        {/* Interviews Section - Client Component */}
        <DashboardInterviews />
      </div>
    </main>
  )
}
