import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import InstitutionGuestView from "@/components/institution-guest-view"

export default async function InstitutionViewPage() {
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

  if (!user) {
    redirect("/auth")
  }

  const { data: usersData } = await supabase
    .from("users")
    .select("id, email, name, created_at")
    .order("created_at", { ascending: false })

  // Fetch all interviews with their results
  const { data: interviewsData } = await supabase
    .from("interviews")
    .select("id, user_id, created_at, status")
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  // Fetch all interview results
  const { data: resultsData } = await supabase
    .from("interview_results")
    .select("id, interview_id, overall_score, technical_score, communication_score, confidence_score, created_at")

  // Transform data to match the component interface by joining in code
  const members =
    usersData?.map((user) => {
      // Find all interviews for this user
      const userInterviews = interviewsData?.filter((interview) => interview.user_id === user.id) || []

      // Get all results for this user's interviews
      const userResults = userInterviews.flatMap(
        (interview) => resultsData?.filter((result) => result.interview_id === interview.id) || [],
      )

      return {
        id: user.id,
        users: {
          id: user.id,
          email: user.email,
          name: user.name,
          interview_results: userResults,
        },
      }
    }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <InstitutionGuestView members={members} />
    </div>
  )
}
