"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Users, TrendingUp, Award, Search, UserPlus, UserMinus, Activity, BarChart3, Copy, Check, AlertCircle, Calendar } from 'lucide-react'
import UploadMembersModal from "@/components/upload-members-modal"

interface Member {
  id: string
  name: string
  email: string
  role: string
  total_interviews: number
  avg_score: number
  last_active: string
}

interface Institution {
  id: string
  name: string
  email_domain: string
  created_at: string
}

interface InstitutionDashboardContentProps {
  institutionId: string
  institutionName: string
}

export default function InstitutionDashboardContent({
  institutionId,
  institutionName,
}: InstitutionDashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const [members, setMembers] = useState<Member[]>([])
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalInterviews: 0,
    avgScore: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [inviteCode, setInviteCode] = useState<string>("")
  const [copiedCode, setCopiedCode] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchMembers()
    fetchInviteCode()
  }, [institutionId])

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/institution/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalMembers: data.totalMembers || 0,
          activeMembers: data.totalMembers || 0, // Using totalMembers as activeMembers for now
          totalInterviews: data.totalInterviews || 0,
          avgScore: data.averageScore || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/institution/members`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const fetchInviteCode = async () => {
    try {
      const response = await fetch("/api/institution/invite-code")
      const data = await response.json()

      if (data.needsMigration) {
        setInviteCode("MIGRATION_NEEDED")
        return
      }

      if (response.ok) {
        setInviteCode(data.inviteCode)
      }
    } catch (error) {
      console.error("Error fetching invite code:", error)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) return

    setIsAddingMember(true)
    try {
      const response = await fetch("/api/institution/members/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId,
          email: newMemberEmail,
        }),
      })

      if (response.ok) {
        setNewMemberEmail("")
        fetchMembers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error adding member:", error)
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const response = await fetch("/api/institution/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })

      if (response.ok) {
        fetchMembers()
        fetchStats()
      }
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push("/auth")
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Invite Code Card */}
        {inviteCode === "MIGRATION_NEEDED" ? (
          <Card className="border-amber-200 bg-amber-50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 mb-2">Database Migration Required</h3>
                  <p className="text-sm text-amber-800 mb-3">
                    To enable institution invite codes, please run the SQL migration script.
                  </p>
                  <div className="bg-amber-100 p-3 rounded-md">
                    <code className="text-xs text-amber-900">scripts/006_add_institution_invite_code.sql</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm mb-8 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Institution Invite Code</CardTitle>
              <CardDescription>Share this code with users to let them join your institution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 bg-white border-2 border-blue-200 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600 tracking-wider text-center">
                    {inviteCode || "Loading..."}
                  </p>
                </div>
                <Button
                  onClick={copyInviteCode}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!inviteCode}
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalMembers}</div>
              <p className="text-xs text-gray-500 mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Members</CardTitle>
              <Activity className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.activeMembers}</div>
              <p className="text-xs text-gray-500 mt-1">Active this month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Interviews</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</div>
              <p className="text-xs text-gray-500 mt-1">Completed interviews</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
              <Award className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.avgScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Institution average</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/institution-dashboard/batches">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Batches</h3>
                    <p className="text-sm text-gray-600">Create and organize batches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/institution-dashboard/schedule">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Schedule Interviews</h3>
                    <p className="text-sm text-gray-600">Create and manage schedules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/institution-dashboard/members">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Users className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Manage Members</h3>
                    <p className="text-sm text-gray-600">Add, remove, and manage roles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/institution-dashboard/performance">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Performance Analytics</h3>
                    <p className="text-sm text-gray-600">View detailed insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/institution-dashboard/leaderboard">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Award className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Leaderboard</h3>
                    <p className="text-sm text-gray-600">View top performers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Add Member Section */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900">Add New Member</CardTitle>
            <CardDescription>Invite a new member to your institution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <Input
                placeholder="Enter member email..."
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Button onClick={handleAddMember} disabled={isAddingMember}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
                {/* Upload list button next to Add Member */}
                <UploadMembersModal triggerClassName="bg-white border hover:bg-white text-gray-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900">Members</CardTitle>
                <CardDescription>Manage your institution members</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No members found</p>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 font-semibold">
                          {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{member.name || "No name"}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{member.total_interviews} interviews</p>
                        <p className="text-sm text-gray-600">Avg: {member.avg_score}%</p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {member.role}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)}>
                        <UserMinus className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
