"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface User {
  id: string
  email: string
  name: string
  balance: number
}

interface CreditTransaction {
  id: string
  user_id: string
  delta: number
  reason: string
  metadata: any
  created_at: string
}

interface HealthCheck {
  name: string
  status: "healthy" | "degraded" | "unhealthy"
  latency: number
  message?: string
  lastChecked: string
}

interface HealthCheckResponse {
  overall: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  checks: HealthCheck[]
}

interface InstitutionDetails {
  id: string
  name: string
  email_domain: string
  created_at: string
  member_count: number
  batch_count: number
  credits_used: number
  groq_calls: number
  balance: number
  scheduled_interviews_count: number
  admins: { id: string; name: string; email: string }[]
}

interface Batch {
  id: string
  name: string
  description: string
  join_code: string
  created_at: string
  member_count: number
  creator_name: string
}

interface InstitutionMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  email: string
  name: string
  balance: number
}

export function SuperAdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("users")
  const [overviewData, setOverviewData] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState<{ balance: number; transactions: CreditTransaction[] } | null>(null)
  const [creditAmount, setCreditAmount] = useState<string>("")
  const [creditReason, setCreditReason] = useState<string>("")
  const [showUserDetails, setShowUserDetails] = useState(false)
  // New state for institution user creation
  const [institutionName, setInstitutionName] = useState("") // Institution name (e.g., "MIT", "Stanford")
  const [institutionUserName, setInstitutionUserName] = useState("") // Admin user's name (e.g., "John Smith")
  const [institutionUserEmail, setInstitutionUserEmail] = useState("")
  const [institutionEmailDomain, setInstitutionEmailDomain] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [createInstitutionLoading, setCreateInstitutionLoading] = useState(false)
  
  // Health check state
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null)
  
  // Institution inspection state
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null)
  const [institutionDetails, setInstitutionDetails] = useState<InstitutionDetails | null>(null)
  const [institutionBatches, setInstitutionBatches] = useState<Batch[]>([])
  const [institutionMembers, setInstitutionMembers] = useState<InstitutionMember[]>([])
  const [inspectLoading, setInspectLoading] = useState(false)
  const [inspectTab, setInspectTab] = useState<"overview" | "batches" | "members">("overview")
  
  // Search debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  
  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+"
    let password = ""
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    toast.info("Password generated!")
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword)
    toast.success("Password copied to clipboard!")
  }

  const handleCreateInstitutionUser = async () => {
    if (!institutionName || !institutionUserName || !institutionUserEmail || !institutionEmailDomain || !generatedPassword) {
      toast.error("Please fill in all fields and generate a password.")
      return
    }

    setCreateInstitutionLoading(true)
    try {
      // 1. Create the Institution first
      const institutionRes = await fetch("/api/super-admin/institutions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: institutionName, // Use the proper institution name
          email_domain: institutionEmailDomain,
        }),
      });

      const institutionData = await institutionRes.json();

      if (!institutionRes.ok) {
        toast.error(institutionData.error || "Failed to create institution.");
        return;
      }

      const newInstitutionId = institutionData.institution.id;

      // 2. Then, create the Institution User and link it to the new Institution
      const userRes = await fetch("/api/super-admin/institution-users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: institutionUserName,
          email: institutionUserEmail,
          password: generatedPassword,
          institution_id: newInstitutionId,
        }),
      });

      const data = await userRes.json();
      if (userRes.ok) {
        toast.success("Institution user created successfully!");
        setInstitutionName(""); // Clear institution name
        setInstitutionUserName("");
        setInstitutionUserEmail("");
        setInstitutionEmailDomain(""); // Clear email domain as well
        setGeneratedPassword("");
        // Optionally refresh the institutions list if they are displayed elsewhere
        fetchInstitutions();
      } else {
        toast.error(data.error || "Failed to create institution user.");
      }
    } catch (error: any) {
      console.error("Error creating institution user:", error)
      toast.error(error.message || "An unexpected error occurred during user creation.")
    } finally {
      setCreateInstitutionLoading(false)
    }
  }

  const fetchOverviewData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/overview")
      const data = await res.json()
      if (res.ok) {
        setOverviewData(data)
      } else {
        toast.error(data.error || "Failed to fetch overview data")
      }
    } catch (error: any) {
      console.error("Error fetching overview:", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users?search=${debouncedSearchTerm}&limit=100`)
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
      } else {
        toast.error(data.error || "Failed to fetch users")
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm])

  const [editingInstitutionId, setEditingInstitutionId] = useState<string | null>(null)
  const [editingBalanceValue, setEditingBalanceValue] = useState<number | string>(0)

  const fetchInstitutions = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/super-admin/institutions")
      const data = await res.json()
      if (res.ok) {
        setInstitutions(data.institutions)
      } else {
        toast.error(data.error || "Failed to fetch institutions")
      }
    } catch (error: any) {
      console.error("Error fetching institutions:", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  } 

  const openSetBalance = (inst: any) => {
    setEditingInstitutionId(inst.id)
    setEditingBalanceValue(inst.balance ?? 0)
  }

  const refreshInstitution = async (instId: string) => {
    try {
      const res = await fetch(`/api/super-admin/institutions`)
      const data = await res.json()
      if (res.ok) {
        const updated = data.institutions.find((i: any) => i.id === instId)
        setInstitutions((prev) => prev.map((p) => (p.id === instId ? updated : p)))
        toast.success("Institution refreshed")
      } else {
        toast.error(data.error || "Failed to refresh")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh")
    }
  }

  const handleSetInstitutionBalance = async (inst: any) => {
    if (!editingInstitutionId) return
    const desired = Number(editingBalanceValue)
    if (Number.isNaN(desired)) {
      toast.error("Please enter a valid numeric balance")
      return
    }

    try {
      setLoading(true)
      // Compute delta relative to current balance
      const delta = desired - (inst.balance || 0)
      if (delta === 0) {
        toast.info("Balance is already the requested amount")
        setEditingInstitutionId(null)
        return
      }

      // Send absolute value to server (set_to). Server will compute delta and record tx.
      const res = await fetch(`/api/super-admin/institutions/${inst.id}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_to: desired, reason: 'set_balance_by_super_admin' }),
      })
      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch (err) {
        console.error('Failed to parse response JSON for set balance:', text, err)
      }

      if (res.ok) {
        const newBal = data?.newBalance ?? desired
        // Update local state
        setInstitutions((prev) => prev.map((p) => (p.id === inst.id ? { ...p, balance: newBal } : p)))
        toast.success('Institution balance updated')
        setEditingInstitutionId(null)
        setEditingBalanceValue(0)
      } else {
        const errMsg = data?.error || `Failed to update balance (HTTP ${res.status})`
        toast.error(errMsg)
        console.error('Set balance failed:', res.status, text)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update balance')
    } finally {
      setLoading(false)
    }
  }

  // Fetch institution details for inspection
  const fetchInstitutionDetails = async (institutionId: string) => {
    setInspectLoading(true)
    try {
      const res = await fetch(`/api/super-admin/institutions/${institutionId}`)
      const data = await res.json()
      if (res.ok) {
        setInstitutionDetails(data.institution)
      } else {
        toast.error(data.error || "Failed to fetch institution details")
      }
    } catch (error: any) {
      console.error("Error fetching institution details:", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setInspectLoading(false)
    }
  }

  const fetchInstitutionBatches = async (institutionId: string) => {
    try {
      const res = await fetch(`/api/super-admin/institutions/${institutionId}/batches`)
      const data = await res.json()
      if (res.ok) {
        setInstitutionBatches(data.batches || [])
      } else {
        toast.error(data.error || "Failed to fetch batches")
      }
    } catch (error: any) {
      console.error("Error fetching batches:", error)
      toast.error(error.message || "An unexpected error occurred")
    }
  }

  const fetchInstitutionMembers = async (institutionId: string) => {
    try {
      const res = await fetch(`/api/super-admin/institutions/${institutionId}/members`)
      const data = await res.json()
      if (res.ok) {
        setInstitutionMembers(data.members || [])
      } else {
        toast.error(data.error || "Failed to fetch members")
      }
    } catch (error: any) {
      console.error("Error fetching members:", error)
      toast.error(error.message || "An unexpected error occurred")
    }
  }

  const handleInspectInstitution = async (institutionId: string) => {
    setSelectedInstitution(institutionId)
    setInspectTab("overview")
    await fetchInstitutionDetails(institutionId)
    await fetchInstitutionBatches(institutionId)
    await fetchInstitutionMembers(institutionId)
  }

  const handleCloseInspect = () => {
    setSelectedInstitution(null)
    setInstitutionDetails(null)
    setInstitutionBatches([])
    setInstitutionMembers([])
  }

  const fetchUserCredits = async (userId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${userId}/credits`)
      const data = await res.json()
      if (res.ok) {
        setUserCredits(data)
      } else {
        toast.error(data.error || "Failed to fetch user credits")
      }
    } catch (error: any) {
      console.error("Error fetching user credits:", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCredits = async () => {
    if (!selectedUser || !creditAmount) {
      toast.error("Please select a user and enter an amount")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/super-admin/users/${selectedUser}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(creditAmount),
          reason: creditReason || "admin_adjustment",
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setCreditAmount("")
        setCreditReason("")
        fetchUserCredits(selectedUser) // Refresh credits after adding
        toast.success("Credits added successfully!")
      } else {
        toast.error(data.error || "Failed to add credits")
      }
    } catch (error: any) {
      console.error("Error adding credits from frontend:", error)
      toast.error(error.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  // Health check function
  const fetchHealthCheck = useCallback(async () => {
    console.log("[health] Starting health check fetch...")
    setHealthLoading(true)
    try {
      const res = await fetch("/api/super-admin/health")
      console.log("[health] Response status:", res.status)
      const text = await res.text()
      console.log("[health] Response text:", text.substring(0, 200))
      
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        console.error("[health] Failed to parse response:", parseErr)
        toast.error("Invalid response from health check API")
        return
      }
      
      if (res.ok) {
        console.log("[health] Health data received:", data)
        setHealthData(data)
        setLastHealthCheck(new Date())
      } else {
        console.error("[health] Error response:", data)
        toast.error(data.error || "Failed to fetch health status")
      }
    } catch (error: any) {
      console.error("[health] Fetch error:", error)
      toast.error(error.message || "Failed to fetch health status")
    } finally {
      setHealthLoading(false)
    }
  }, [])

  // Get status color and icon
  const getStatusBadge = (status: "healthy" | "degraded" | "unhealthy") => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500 hover:bg-green-600">✓ Healthy</Badge>
      case "degraded":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">⚠ Degraded</Badge>
      case "unhealthy":
        return <Badge className="bg-red-500 hover:bg-red-600">✗ Unhealthy</Badge>
    }
  }

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return "text-green-600"
    if (latency < 500) return "text-yellow-600"
    return "text-red-600"
  }

  useEffect(() => {
    if (activeTab === "overview") {
      fetchOverviewData()
    } else if (activeTab === "users") {
      fetchUsers()
    } else if (activeTab === "institutions" || activeTab === "create-institution-user") {
      fetchInstitutions()
    } else if (activeTab === "health") {
      fetchHealthCheck()
    }
  }, [activeTab, debouncedSearchTerm, fetchHealthCheck, fetchUsers])

  useEffect(() => {
    if (selectedUser && showUserDetails) {
      fetchUserCredits(selectedUser)
    }
  }, [selectedUser, showUserDetails])

  const userToDisplay = users.find((u) => u.id === selectedUser)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
          <TabsTrigger value="health">Health Check</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="create-institution-user">Create Institution</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-xl font-semibold">Overview Data</h2>
          {loading ? (
            <p>Loading overview...</p>
          ) : overviewData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <h3 className="text-lg font-medium">Total Credits Issued</h3>
                <p className="text-2xl font-bold">{overviewData.total_credits_issued || 0}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-medium">Total Credits Remaining</h3>
                <p className="text-2xl font-bold">{overviewData.total_credits_remaining || 0}</p>
              </Card>
              <Card className="p-4">
                <h3 className="text-lg font-medium">Total GROQ Calls</h3>
                <p className="text-2xl font-bold">{overviewData.total_groq_calls || 0}</p>
              </Card>
            </div>
          ) : (
            <p>No overview data available.</p>
          )}
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <h2 className="text-xl font-semibold">Users</h2>
          <Input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          {loading ? (
            <p>Loading users...</p>
          ) : showUserDetails && userToDisplay ? (
            <div className="space-y-4 p-4 border rounded-md">
              <Button onClick={() => setShowUserDetails(false)}>← Back to Users</Button>
              <h3 className="text-xl font-semibold">User Details: {userToDisplay.email}</h3>
              <p><strong>Name:</strong> {userToDisplay.name}</p>
              <p><strong>Current Credits:</strong> {userCredits?.balance ?? "Loading..."}</p>
              <div className="mt-4 space-y-2">
                <h4 className="text-lg font-medium">Add Credits</h4>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-32"
                  />
                  <Textarea
                    placeholder="Reason (optional)"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddCredits} disabled={loading}>
                    Add
                  </Button>
                </div>
              </div>
              <div className="mt-8">
                <h4 className="text-lg font-medium">Credit Transactions</h4>
                {userCredits?.transactions && userCredits.transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Delta</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Metadata</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userCredits.transactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell className={txn.delta > 0 ? "text-green-600" : "text-red-600"}>
                            {txn.delta > 0 ? `+${txn.delta}` : txn.delta}
                          </TableCell>
                          <TableCell>{txn.reason}</TableCell>
                          <TableCell>{format(new Date(txn.created_at), "PPP p")}</TableCell>
                          <TableCell>{JSON.stringify(txn.metadata)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No transactions found.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">S.No</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.balance}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user.id)
                            setShowUserDetails(true)
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="institutions" className="space-y-4">
          <h2 className="text-xl font-semibold">Institutions</h2>
          
          {/* Institution Inspection View */}
          {selectedInstitution && institutionDetails ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handleCloseInspect}>
                  ← Back to Institutions
                </Button>
                <h3 className="text-lg font-semibold">{institutionDetails.name}</h3>
              </div>
              
              {/* Inspection Tabs */}
              <div className="flex gap-2 border-b pb-2">
                <Button 
                  variant={inspectTab === "overview" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setInspectTab("overview")}
                >
                  Overview
                </Button>
                <Button 
                  variant={inspectTab === "batches" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setInspectTab("batches")}
                >
                  Batches ({institutionBatches.length})
                </Button>
                <Button 
                  variant={inspectTab === "members" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setInspectTab("members")}
                >
                  Members ({institutionMembers.length})
                </Button>
              </div>

              {inspectLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  {/* Overview Tab */}
                  {inspectTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <h4 className="text-sm text-muted-foreground">Total Members</h4>
                          <p className="text-2xl font-bold">{institutionDetails.member_count}</p>
                        </Card>
                        <Card className="p-4">
                          <h4 className="text-sm text-muted-foreground">Total Batches</h4>
                          <p className="text-2xl font-bold">{institutionDetails.batch_count}</p>
                        </Card>
                        <Card className="p-4">
                          <h4 className="text-sm text-muted-foreground">Credit Balance</h4>
                          <p className="text-2xl font-bold">{institutionDetails.balance}</p>
                        </Card>
                        <Card className="p-4">
                          <h4 className="text-sm text-muted-foreground">Credits Used</h4>
                          <p className="text-2xl font-bold">{institutionDetails.credits_used}</p>
                        </Card>
                        <Card className="p-4">
                          <h4 className="text-sm text-muted-foreground">GROQ Calls</h4>
                          <p className="text-2xl font-bold">{institutionDetails.groq_calls}</p>
                        </Card>
                        <Card className="p-4">
                          <h4 className="text-sm text-muted-foreground">Scheduled Interviews</h4>
                          <p className="text-2xl font-bold">{institutionDetails.scheduled_interviews_count}</p>
                        </Card>
                      </div>
                      
                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Institution Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>ID:</strong> <span className="font-mono">{institutionDetails.id}</span></p>
                          <p><strong>Email Domain:</strong> {institutionDetails.email_domain}</p>
                          <p><strong>Created:</strong> {format(new Date(institutionDetails.created_at), "PPP")}</p>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-medium mb-2">Admins ({institutionDetails.admins?.length || 0})</h4>
                        {institutionDetails.admins && institutionDetails.admins.length > 0 ? (
                          <div className="space-y-2">
                            {institutionDetails.admins.map((admin) => (
                              <div key={admin.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div>
                                  <p className="font-medium">{admin.name}</p>
                                  <p className="text-sm text-muted-foreground">{admin.email}</p>
                                </div>
                                <Badge>Admin</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No admins found</p>
                        )}
                      </Card>

                      {/* Quick Actions */}
                      <Card className="p-4">
                        <h4 className="font-medium mb-3">Quick Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              openSetBalance(institutionDetails)
                              handleCloseInspect()
                            }}
                          >
                            Set Balance
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(institutionDetails.id)
                              toast.success("Institution ID copied")
                            }}
                          >
                            Copy ID
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Batches Tab */}
                  {inspectTab === "batches" && (
                    <div className="space-y-4">
                      {institutionBatches.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Join Code</TableHead>
                              <TableHead>Members</TableHead>
                              <TableHead>Created By</TableHead>
                              <TableHead>Created At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {institutionBatches.map((batch) => (
                              <TableRow key={batch.id}>
                                <TableCell className="font-medium">{batch.name}</TableCell>
                                <TableCell className="max-w-xs truncate">{batch.description || "-"}</TableCell>
                                <TableCell>
                                  <code className="bg-muted px-2 py-1 rounded text-sm">{batch.join_code}</code>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="ml-2 h-6 w-6 p-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(batch.join_code)
                                      toast.success("Join code copied")
                                    }}
                                  >
                                    📋
                                  </Button>
                                </TableCell>
                                <TableCell>{batch.member_count}</TableCell>
                                <TableCell>{batch.creator_name}</TableCell>
                                <TableCell>{format(new Date(batch.created_at), "PP")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Card className="p-8 text-center">
                          <p className="text-muted-foreground">No batches found for this institution</p>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Members Tab */}
                  {inspectTab === "members" && (
                    <div className="space-y-4">
                      {institutionMembers.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Credits</TableHead>
                              <TableHead>Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {institutionMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                  <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                                    {member.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>{member.balance}</TableCell>
                                <TableCell>{format(new Date(member.joined_at), "PP")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Card className="p-8 text-center">
                          <p className="text-muted-foreground">No members found for this institution</p>
                        </Card>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : loading ? (
            <p>Loading institutions...</p>
          ) : institutions && institutions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email Domain</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Credits Used</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutions.map((inst, index) => (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{inst.name}</TableCell>
                    <TableCell>{inst.email_domain}</TableCell>
                    <TableCell>{inst.member_count || 0}</TableCell>
                    <TableCell>{inst.credits_used}</TableCell>
                    <TableCell>{inst.balance ?? 0}</TableCell>
                    <TableCell>
                      {editingInstitutionId === inst.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="border px-2 py-1 rounded w-28"
                            value={String(editingBalanceValue)}
                            onChange={(e) => setEditingBalanceValue(e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleSetInstitutionBalance(inst)} disabled={loading}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingInstitutionId(null); setEditingBalanceValue(0) }}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" onClick={() => handleInspectInstitution(inst.id)}>
                            Inspect
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openSetBalance(inst)}>
                            Set Balance
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => refreshInstitution(inst.id)}>
                            ↻
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No institutions found.</p>
          )}
        </TabsContent>
        <TabsContent value="health" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">System Health Check</h2>
            <div className="flex items-center gap-4">
              {lastHealthCheck && (
                <span className="text-sm text-muted-foreground">
                  Last checked: {format(lastHealthCheck, "PPP p")}
                </span>
              )}
              <Button onClick={fetchHealthCheck} disabled={healthLoading} size="sm">
                {healthLoading ? "Checking..." : "Refresh"}
              </Button>
            </div>
          </div>
          
          {healthLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3">Running health checks...</span>
            </div>
          ) : healthData && healthData.checks && healthData.checks.length > 0 ? (
            <div className="space-y-6">
              {/* Overall Status Card */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Overall System Status</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {healthData.overall === "healthy" 
                        ? "All systems operational" 
                        : healthData.overall === "degraded"
                        ? "Some services experiencing issues"
                        : "Critical issues detected"}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(healthData.overall)}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(healthData.timestamp), "PPP p")}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Individual Service Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.checks.map((check, index) => (
                  <Card key={index} className={`p-4 border-l-4 ${
                    check.status === "healthy" ? "border-l-green-500" :
                    check.status === "degraded" ? "border-l-yellow-500" :
                    "border-l-red-500"
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{check.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {check.message}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        {getStatusBadge(check.status)}
                        <p className={`text-xs mt-2 font-mono ${getLatencyColor(check.latency)}`}>
                          {check.latency}ms
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card className="p-4">
                <h3 className="font-medium mb-3">Quick Diagnostics</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(healthData, null, 2))
                      toast.success("Health data copied to clipboard")
                    }}
                  >
                    Copy Report
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(healthData, null, 2)], { type: "application/json" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `health-report-${format(new Date(), "yyyy-MM-dd-HH-mm")}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                      toast.success("Report downloaded")
                    }}
                  >
                    Download Report
                  </Button>
                </div>
              </Card>
            </div>
          ) : healthData && healthData.error ? (
            <Card className="p-8 text-center border-red-200 bg-red-50">
              <p className="text-red-600 font-medium">Health Check Error</p>
              <p className="text-sm text-red-500 mt-2">{healthData.error}</p>
              <Button onClick={fetchHealthCheck} className="mt-4" size="sm">
                Retry
              </Button>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Click "Refresh" to run health checks</p>
              <Button onClick={fetchHealthCheck} className="mt-4" size="sm">
                Run Health Check
              </Button>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="bulk-upload" className="space-y-4">
          <h2 className="text-xl font-semibold">Bulk Upload</h2>
          <p>Bulk upload functionality coming soon.</p>
        </TabsContent>
        {/* New Tab Content for Institution User Creation */}
        <TabsContent value="create-institution-user" className="space-y-4">
          <h2 className="text-xl font-semibold">Create Institution User</h2>
          <Card className="p-4 space-y-4">
            <div>
              <label htmlFor="inst-name" className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name
              </label>
              <Input
                id="inst-name"
                type="text"
                placeholder="e.g., MIT, Stanford University"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">The name of the institution being created</p>
            </div>
            <div>
              <label htmlFor="inst-email-domain" className="block text-sm font-medium text-gray-700 mb-2">
                Institution Email Domain
              </label>
              <Input
                id="inst-email-domain"
                type="text"
                placeholder="institution.edu"
                value={institutionEmailDomain}
                onChange={(e) => setInstitutionEmailDomain(e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">Users with this email domain can join this institution</p>
            </div>
            <hr className="my-4" />
            <h3 className="text-lg font-medium text-gray-800">Institution Admin User</h3>
            <div>
              <label htmlFor="inst-user-name" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Name
              </label>
              <Input
                id="inst-user-name"
                type="text"
                placeholder="e.g., John Smith"
                value={institutionUserName}
                onChange={(e) => setInstitutionUserName(e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">The name of the admin user for this institution</p>
            </div>
            <div>
              <label htmlFor="inst-user-email" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Email
              </label>
              <Input
                id="inst-user-email"
                type="email"
                placeholder="admin@institution.edu"
                value={institutionUserEmail}
                onChange={(e) => setInstitutionUserEmail(e.target.value)}
                className="max-w-md"
              />
              <p className="text-xs text-gray-500 mt-1">The admin user's email address</p>
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label htmlFor="generated-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Password
                </label>
                <Input
                  id="generated-password"
                  type="text"
                  readOnly
                  value={generatedPassword}
                  placeholder="Click 'Generate' to create a password"
                  className="w-full font-mono"
                />
              </div>
              <Button onClick={generatePassword} variant="outline">
                Generate
              </Button>
              <Button onClick={handleCopyPassword} disabled={!generatedPassword}>
                Copy
              </Button>
            </div>
            <Button
              onClick={handleCreateInstitutionUser}
              disabled={createInstitutionLoading || !institutionName || !institutionUserName || !institutionUserEmail || !institutionEmailDomain || !generatedPassword}
              className="w-full"
            >
              {createInstitutionLoading ? "Creating..." : "Create Institution & Admin User"}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
