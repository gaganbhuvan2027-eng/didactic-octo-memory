"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Users, Plus, Trash2, Search, Mail, Calendar, UserCheck, Copy, Check, Edit, Coins } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import InstitutionNavbar from "@/components/institution-navbar"

interface BatchMember {
  id: string
  user_id: string
  added_at: string
  user: {
    name: string
    email: string
  }
}

interface InstitutionMember {
  id: string
  memberRowId?: string
  name: string
  email: string
  user_type: string
  role?: string
}

interface Batch {
  id: string
  name: string
  description: string
  created_at: string
  member_count: number
  join_code: string
}

export default function BatchDetailPage() {
  const router = useRouter()
  const params = useParams()
  const batchId = params.id as string

  const [loading, setLoading] = useState(true)
  const [batch, setBatch] = useState<Batch | null>(null)
  const [members, setMembers] = useState<BatchMember[]>([])
  const [availableMembers, setAvailableMembers] = useState<InstitutionMember[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [editingRoleFor, setEditingRoleFor] = useState<string | null>(null)
  const [roleUpdating, setRoleUpdating] = useState(false)

  const roles = [
    { value: "member", label: "Member" },
    { value: "moderator", label: "Moderator" },
    { value: "admin", label: "Admin" },
  ]
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)

  // Distribution state
  const [perMemberAmount, setPerMemberAmount] = useState<number | "">(0)
  const [instBalance, setInstBalance] = useState<number | null>(null)
  const [distributing, setDistributing] = useState(false)

  useEffect(() => {
    fetchBatchDetails()
    fetchAvailableMembers()
    fetchInstitutionBalance()
  }, [batchId])

  const fetchBatchDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/institution/batches/${batchId}`)
      if (response.ok) {
        const data = await response.json()
        setBatch(data.batch)
        setMembers(data.batch.batch_members || [])
      }
      // refresh available members to get updated roles/memberRowId
      await fetchAvailableMembers()
    } catch (error) {
      console.error("Error fetching batch details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableMembers = async () => {
    try {
      const response = await fetch("/api/institution/members")
      if (response.ok) {
        const data = await response.json()
        // API now returns memberRowId and role
        setAvailableMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching available members:", error)
    }
  }

  // Fetch institution credit balance for preview & validation
  const fetchInstitutionBalance = async () => {
    try {
      const res = await fetch('/api/institution/credits')
      if (!res.ok) return
      const data = await res.json()
      setInstBalance(typeof data.balance === 'number' ? data.balance : 0)
    } catch (err) {
      console.error('Failed to fetch institution balance', err)
    }
  }

  // Distribute credits to batch: amount = per-member amount
  const handleDistribute = async () => {
    const amount = Number(perMemberAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid credit amount')
      return
    }

    const memberCount = members.length
    if (memberCount === 0) {
      setError('No members in this batch to distribute to')
      return
    }

    const total = amount * memberCount

    if (instBalance !== null && instBalance < total) {
      setError('Insufficient institution balance for this distribution')
      return
    }

    if (!confirm(`Distribute ${amount} credits to ${memberCount} member(s) (total ${total} credits)?`)) return

    setDistributing(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch(`/api/institution/batches/${batchId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Distribution failed')
      }

      if (data && data.success) {
        setSuccess(`Distributed ${amount} credits to ${data.distributed_to} member(s). Total debited: ${data.total_debited}`)
        // refresh balances and batch details
        fetchBatchDetails()
        fetchInstitutionBalance()
      } else {
        // Handle function returning a jsonb with success:false
        setError(data.message || 'Distribution failed')
      }
    } catch (err: any) {
      setError(err.message || 'Distribution failed')
    } finally {
      setDistributing(false)
    }
  }

  const handleAddMembers = async () => {
    console.log("[v0] handleAddMembers called")
    console.log("[v0] selectedMembers size:", selectedMembers.size)
    console.log("[v0] selectedMembers content:", Array.from(selectedMembers))
    
    if (selectedMembers.size === 0) {
      setError("Please select at least one member")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/institution/batches/${batchId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedMembers),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add members")
      }

      setSuccess(`Successfully added ${selectedMembers.size} member(s)`)
      setSelectedMembers(new Set())
      setShowAddForm(false)
      fetchBatchDetails()
    } catch (err: any) {
      setError(err.message || "Failed to add members")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberUserId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this batch?`)) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/institution/batches/${batchId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberUserId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to remove member")
      }

      setSuccess("Member removed successfully")
      fetchBatchDetails()
    } catch (err: any) {
      setError(err.message || "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const toggleMemberSelection = (userId: string) => {
    const newSelection = new Set(selectedMembers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedMembers(newSelection)
  }

  const copyJoinCode = () => {
    if (batch?.join_code) {
      navigator.clipboard.writeText(batch.join_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleUpdateRole = async (memberRowId: string, newRole: string) => {
    if (!memberRowId) return
    setRoleUpdating(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/institution/members/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberRowId, newRole }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to update role")

      setSuccess("Role updated successfully")
      setEditingRoleFor(null)
      fetchBatchDetails()
    } catch (err: any) {
      setError(err.message || "Failed to update role")
    } finally {
      setRoleUpdating(false)
    }
  }

  const handleRemoveFromInstitution = async (memberRowId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the institution? This will also remove them from all batches.`)) return

    // refresh institution balance afterwards in case credits were affected elsewhere
    try {
      await fetchInstitutionBalance()
    } catch (err) {
      // ignore
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/institution/members/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberRowId }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to remove member")

      setSuccess("Member removed from institution")
      fetchBatchDetails()
      fetchAvailableMembers()
    } catch (err: any) {
      setError(err.message || "Failed to remove member")
    } finally {
      setLoading(false)
    }
  }

  const memberIds = new Set(members.map((m) => m.user_id))
  const filteredAvailableMembers = availableMembers
    .filter((m) => !memberIds.has(m.id))
    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredMembers = members.filter(
    (m) => m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading && !batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading batch details...</p>
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">Batch not found</p>
            <Button onClick={() => router.push('/institution-dashboard/batches')}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <InstitutionNavbar />
      
      {/* Header */}
      <div className="pt-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/institution-dashboard/batches')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Batches
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {batch.name}
              </h1>
              <p className="text-gray-600 mt-1">{batch.description || "No description"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => router.push(`/institution-dashboard/schedule?batchId=${batchId}`)} size="lg" className="bg-green-600 hover:bg-green-700 gap-2">
                <Calendar className="w-4 h-4" />
                Schedule practice session
              </Button>

              <Button onClick={() => setShowAddForm(!showAddForm)} size="lg" className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Plus className="w-4 h-4" />
                Add / Manage Members
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">{success}</div>
        )}
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}

        {batch.join_code && (
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-gray-900">Batch Join Code</CardTitle>
              <CardDescription>Share this code with users to let them join this batch directly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-4 bg-white border-2 border-purple-200 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600 tracking-wider text-center">
                    {batch.join_code}
                  </p>
                </div>
                <Button
                  onClick={copyJoinCode}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
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
              <p className="text-sm text-gray-600 mt-3">
                Users can paste this code in their Settings → Join Batch section to join both your institution and this
                batch automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Members Form */}
        {showAddForm && (
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add Members to Batch
              </CardTitle>
              <CardDescription>Select members to add to this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-4">
                  {filteredAvailableMembers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {searchQuery ? "No members found" : "All members are already in this batch"}
                    </p>
                  ) : (
                    filteredAvailableMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer"
                        onClick={() => toggleMemberSelection(member.id)}
                      >
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedMembers.has(member.id)} 
                            onCheckedChange={() => toggleMemberSelection(member.id)} 
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <Badge variant="outline">{member.user_type}</Badge>
                      </div>
                    ))
                  )}
                </div>

                {selectedMembers.size > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>{selectedMembers.size}</strong> member(s) selected
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleAddMembers} disabled={loading || selectedMembers.size === 0} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? "Adding..." : `Add ${selectedMembers.size} Member(s)`}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setSelectedMembers(new Set())
                      setSearchQuery("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Card */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{new Date(batch.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600">Created On</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{availableMembers.length - members.length}</p>
                  <p className="text-sm text-gray-600">Available to Add</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Controls */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-blue-600" />
              Distribute Credits to Batch
            </CardTitle>
            <CardDescription>Add credits to each member of this batch from your institution balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-sm text-gray-600">Amount per member</label>
                <Input
                  type="number"
                  min={0}
                  value={perMemberAmount as any}
                  onChange={(e) => setPerMemberAmount(e.target.value === '' ? '' : Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Each member will receive this many credits.</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Members</label>
                <div className="text-lg font-bold">{members.length}</div>
                <p className="text-xs text-gray-500">Members in batch</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Preview</label>
                <div className="text-sm">
                  <p>Total cost: <strong>{(Number(perMemberAmount || 0) * members.length)}</strong></p>
                  <p>Institution balance: <strong>{instBalance !== null ? instBalance : 'Loading...'}</strong></p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    disabled={distributing || !perMemberAmount || Number(perMemberAmount) <= 0 || members.length === 0 || (instBalance !== null && Number(perMemberAmount) * members.length > instBalance)}
                    onClick={handleDistribute}
                  >
                    {distributing ? 'Distributing...' : `Distribute to ${members.length} member(s)`}
                  </Button>
                  <Button variant="outline" onClick={() => { setPerMemberAmount(0); setError(''); setSuccess(''); }}>
                    Reset
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">This will deduct the total from your institution's credits and add per-member credit transactions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Batch Members
            </CardTitle>
            <CardDescription>Manage members in this batch</CardDescription>
          </CardHeader>
          <CardContent>
            {!showAddForm && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">{searchQuery ? "No members found" : "No members in this batch yet"}</p>
                <p className="text-sm mt-2">{searchQuery ? "Try a different search term" : "Click 'Add Members' to get started"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => {
                  const instMember = availableMembers.find((am) => am.id === member.user.id)
                  const role = instMember?.role || "member"
                  const memberRowId = instMember?.memberRowId || ""

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">{role}</Badge>
                        {editingRoleFor === member.user.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={role}
                              onChange={(e) => handleUpdateRole(memberRowId, e.target.value)}
                              className="border rounded px-2 py-1 text-sm"
                              disabled={roleUpdating}
                            >
                              {roles.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <Button variant="outline" size="sm" onClick={() => setEditingRoleFor(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setEditingRoleFor(member.user.id)} title={`Edit role for ${member.user.name}`} aria-label={`Edit role for ${member.user.name}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <p className="text-xs text-gray-500">Added {new Date(member.added_at).toLocaleDateString()}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.user.id, member.user.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={`Remove ${member.user.name} from batch`}
                              aria-label={`Remove ${member.user.name} from batch`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromInstitution(memberRowId, member.user.name)}
                              className="text-red-700 hover:text-red-800"
                              title={`Remove ${member.user.name} from institution (also removes from batches)`}
                              aria-label={`Remove ${member.user.name} from institution`}
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
