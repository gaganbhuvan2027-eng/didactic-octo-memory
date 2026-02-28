"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { Trophy, Medal } from "lucide-react"
import Link from "next/link"

interface LeaderboardMember {
  id: string
  name: string
  email: string
  rank: number
  averageScore: number
  totalInterviews: number
  technicalScore: number
  communicationScore: number
  problemSolvingScore: number
  confidenceScore: number
  recentImprovement: number
  badges: string[]
}

export default function LeaderboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([])
  const [hasBatch, setHasBatch] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [sortBy, setSortBy] = useState<"overall" | "technical" | "communication" | "problemSolving">("overall")

  useEffect(() => {
    checkBatchMembershipAndFetchLeaderboard()
  }, [])

  const checkBatchMembershipAndFetchLeaderboard = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Check if user is a batch member
      const { data: batchMember } = await supabase
        .from("batch_members")
        .select("*, batches(name)")
        .eq("user_id", user.id)
        .single()

      if (!batchMember) {
        // User is not in a batch
        setHasBatch(false)
        setLoading(false)
        return
      }

      // User is in a batch, fetch batch leaderboard
      setHasBatch(true)
      setBatchName(batchMember.batches?.name || "Batch")

      // Get all batch members
      const { data: batchMembers } = await supabase
        .from("batch_members")
        .select("*, users:user_id(id, email, name)")
        .eq("batch_id", batchMember.batch_id)

      if (!batchMembers) {
        setLeaderboard([])
        setLoading(false)
        return
      }

      const leaderboardData: LeaderboardMember[] = []

      for (const member of batchMembers) {
        const { data: interviews } = await supabase
          .from("interviews")
          .select("id, completed_at")
          .eq("user_id", member.users.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: true })

        const { data: results } = await supabase
          .from("interview_results")
          .select(
            "overall_score, technical_score, communication_score, problem_solving_score, confidence_score, created_at",
          )
          .in("interview_id", interviews?.map((i) => i.id) || [])
          .order("created_at", { ascending: true })

        if (!results || results.length === 0) continue

        const averageScore = Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length)
        const technicalScore = Math.round(
          results.reduce((sum, r) => sum + (r.technical_score || 0), 0) / results.length,
        )
        const communicationScore = Math.round(
          results.reduce((sum, r) => sum + (r.communication_score || 0), 0) / results.length,
        )
        const problemSolvingScore = Math.round(
          results.reduce((sum, r) => sum + (r.problem_solving_score || 0), 0) / results.length,
        )
        const confidenceScore = Math.round(
          results.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / results.length,
        )

        let recentImprovement = 0
        if (results.length >= 6) {
          const recent = results.slice(-3)
          const previous = results.slice(-6, -3)
          const recentAvg = recent.reduce((sum, r) => sum + r.overall_score, 0) / 3
          const previousAvg = previous.reduce((sum, r) => sum + r.overall_score, 0) / 3
          recentImprovement = Math.round(recentAvg - previousAvg)
        }

        const badges: string[] = []
        if (averageScore >= 90) badges.push("Excellence")
        if (interviews.length >= 20) badges.push("Dedicated")
        if (recentImprovement >= 10) badges.push("Rising Star")
        if (technicalScore >= 85) badges.push("Tech Expert")
        if (communicationScore >= 85) badges.push("Great Communicator")
        if (results.length >= 10 && results.every((r) => r.overall_score >= 70)) badges.push("Consistent")

        leaderboardData.push({
          id: member.users.id,
          name: member.users.name || "Unknown",
          email: member.users.email,
          rank: 0,
          averageScore,
          totalInterviews: interviews.length,
          technicalScore,
          communicationScore,
          problemSolvingScore,
          confidenceScore,
          recentImprovement,
          badges,
        })
      }

      leaderboardData.sort((a, b) => b.averageScore - a.averageScore)
      leaderboardData.forEach((member, index) => {
        member.rank = index + 1
      })

      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error("Error checking batch membership:", error)
      setHasBatch(false)
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />
    return null
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Excellence":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Dedicated":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Rising Star":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "Tech Expert":
        return "bg-green-100 text-green-700 border-green-200"
      case "Great Communicator":
        return "bg-pink-100 text-pink-700 border-pink-200"
      case "Consistent":
        return "bg-indigo-100 text-indigo-700 border-indigo-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard]
    switch (sortBy) {
      case "technical":
        sorted.sort((a, b) => b.technicalScore - a.technicalScore)
        break
      case "communication":
        sorted.sort((a, b) => b.communicationScore - a.communicationScore)
        break
      case "problemSolving":
        sorted.sort((a, b) => b.problemSolvingScore - a.problemSolvingScore)
        break
      default:
        sorted.sort((a, b) => b.averageScore - a.averageScore)
    }
    return sorted
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading leaderboard...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!hasBatch) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Leaderboard</h1>
            <p className="text-lg text-gray-600">Compete with your batch members and track your progress.</p>
          </div>

          <Card className="border-0 shadow-lg p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join an Institution</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              To view and compete on the leaderboard, you need to join an institution and batch first. This allows you
              to see how you rank among your peers.
            </p>
            <Link
              href="/profile"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Join an Institution
            </Link>
          </Card>
        </div>
      </main>
    )
  }

  const sortedLeaderboard = getSortedLeaderboard()

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{batchName} Leaderboard</h1>
          <p className="text-lg text-gray-600">See how you rank against your batch members.</p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {sortedLeaderboard.slice(0, 3).map((user, index) => (
              <Card
                key={user.id}
                className={`p-8 border-0 shadow-lg text-center ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-50 to-yellow-100 md:col-span-1 md:row-span-2"
                    : index === 1
                      ? "bg-gradient-to-br from-gray-50 to-gray-100"
                      : "bg-gradient-to-br from-orange-50 to-orange-100"
                }`}
              >
                <div className="text-5xl mb-4">{getMedalIcon(index + 1)}</div>
                <Avatar className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-500">
                  <AvatarFallback className="text-white font-bold">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{user.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">{user.averageScore}%</p>
                <p className="text-sm text-gray-600">{user.totalInterviews} interviews</p>
                {user.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {user.badges.slice(0, 2).map((badge) => (
                      <Badge key={badge} className={`text-xs ${getBadgeColor(badge)}`}>
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Full Leaderboard Table */}
        {leaderboard.length > 0 ? (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-25 border-b border-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Average Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Interviews</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Badges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedLeaderboard.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getMedalIcon(user.rank)}</span>
                          <span className="font-bold text-gray-900">#{user.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500">
                            <AvatarFallback className="text-white font-bold text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-gray-900 block">{user.name}</span>
                            <span className="text-xs text-gray-500">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-blue-100 text-blue-800">{user.averageScore}%</Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{user.totalInterviews}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.badges.slice(0, 2).map((badge) => (
                            <Badge key={badge} className={`text-xs ${getBadgeColor(badge)}`}>
                              {badge}
                            </Badge>
                          ))}
                          {user.badges.length > 2 && (
                            <span className="text-xs text-gray-500">+{user.badges.length - 2}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg p-12 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-6 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No leaderboard data yet</h2>
            <p className="text-gray-600">
              Members in your batch need to complete interviews to appear on the leaderboard.
            </p>
          </Card>
        )}
      </div>
    </main>
  )
}
