"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Users, Shield, Edit, Trash2, Search, UserPlus, Crown, User } from "lucide-react"
import UploadMembersModal from "@/components/upload-members-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
  users: {
    id: string
    email: string
    name: string
  }
}

export default function MembersManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const roles = [
    {
      value: "member",
      label: "Member",
      icon: User,
      color: "bg-blue-100 text-blue-700 border-blue-200",
      description: "Standard member access",
    },
    {
      value: "moderator",
      label: "Moderator",
      icon: Shield,
      color: "bg-purple-100 text-purple-700 border-purple-200",
      description: "Can view analytics and schedules",
    },
    {
      value: "admin",
      label: "Admin",
      icon: Crown,
      color: "bg-orange-100 text-orange-700 border-orange-200",
      description: "Full management access",
    },
  ]

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      const { data: userProfile } = await supabase.from("users").select("institution_id").eq("id", user.id).single()

      if (!userProfile) return

      const { data: institutionMembers } = await supabase
        .from("institution_members")
        .select("*, users:user_id(id, email, name)")
        .eq("institution_id", userProfile.institution_id)
        .order("joined_at", { ascending: false })

      setMembers(institutionMembers || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const response = await fetch("/api/institution/members/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      setSuccess("Role updated successfully")
      setEditingMember(null)
      fetchMembers()
    } catch (err: any) {
      setError(err.message || "Failed to update role")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the institution?`)) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/institution/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member")
      }

      setSuccess("Member removed successfully")
      fetchMembers()
    } catch (err: any) {
      setError(err.message || "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const getRoleInfo = (role: string) => {
    return roles.find((r) => r.value === role) || roles[0]
  }

  const filteredMembers = members.filter(
    (member) =>
      member.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const membersByRole = {
    admin: filteredMembers.filter((m) => m.role === "admin"),
    moderator: filteredMembers.filter((m) => m.role === "moderator"),
    member: filteredMembers.filter((m) => m.role === "member"),
  }

  if (loading && members.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/institution-dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Members & Roles
                </h1>
                <p className="text-gray-600 mt-1">Manage member access and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push("/institution-dashboard")}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </Button>
              {/* Upload list button */}
              <UploadMembersModal triggerClassName="bg-white border hover:bg-white text-gray-700" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>
        )}

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Total Members</p>
                  <p className="text-3xl font-bold">{members.length}</p>
                </div>
                <Users className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-100 mb-1">Admins</p>
                  <p className="text-3xl font-bold">{membersByRole.admin.length}</p>
                </div>
                <Crown className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100 mb-1">Moderators</p>
                  <p className="text-3xl font-bold">{membersByRole.moderator.length}</p>
                </div>
                <Shield className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100 mb-1">Members</p>
                  <p className="text-3xl font-bold">{membersByRole.member.length}</p>
                </div>
                <User className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Legend */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Role Permissions
            </CardTitle>
            <CardDescription>Understanding different access levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((role) => {
                const Icon = role.icon
                return (
                  <div
                    key={role.value}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-full ${role.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{role.label}</p>
                        <p className="text-xs text-gray-500">{role.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search members by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>Manage roles and permissions for each member</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">{searchQuery ? "No members found" : "No members yet"}</p>
                <p className="text-sm mt-2">
                  {searchQuery ? "Try a different search term" : "Add members to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => {
                  const roleInfo = getRoleInfo(member.role)
                  const RoleIcon = roleInfo.icon
                  const isEditing = editingMember === member.id

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="w-12 h-12 border-2 border-white shadow">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-lg">
                            {member.users?.name?.charAt(0).toUpperCase() ||
                              member.users?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{member.users?.name || "Unknown"}</p>
                          <p className="text-sm text-gray-500">{member.users?.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {roles.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            <Button
                              onClick={() => handleUpdateRole(member.id, selectedRole)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save
                            </Button>
                            <Button onClick={() => setEditingMember(null)} size="sm" variant="outline">
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge className={`${roleInfo.color} flex items-center gap-1 px-3 py-1`}>
                              <RoleIcon className="w-3 h-3" />
                              {roleInfo.label}
                            </Badge>
                            <Button
                              onClick={() => {
                                setEditingMember(member.id)
                                setSelectedRole(member.role)
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveMember(member.id, member.users?.name || member.users?.email)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
