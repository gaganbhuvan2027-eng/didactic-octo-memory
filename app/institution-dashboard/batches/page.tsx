"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Users, Plus, Edit, Trash2, Search, FolderOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import InstitutionNavbar from "@/components/institution-navbar"

interface Batch {
  id: string
  name: string
  description: string
  member_count: number
  created_at: string
  created_by: {
    name: string
    email: string
  }
}

export default function BatchesPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [batches, setBatches] = useState<Batch[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [batchName, setBatchName] = useState("")
  const [batchDescription, setBatchDescription] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [tableNotFound, setTableNotFound] = useState(false)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/institution/batches")
      
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
        setTableNotFound(false)
      } else if (response.status === 404) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.code === 'PGRST205' || errorData.message?.includes('batches')) {
          setTableNotFound(true)
        }
      }
    } catch (error) {
      console.error("Error fetching batches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!batchName.trim()) {
      setError("Batch name is required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/institution/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: batchName,
          description: batchDescription,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create batch")
      }

      setSuccess("Batch created successfully!")
      setBatchName("")
      setBatchDescription("")
      setShowCreateForm(false)
      fetchBatches()
    } catch (err: any) {
      setError(err.message || "Failed to create batch")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete the batch "${batchName}"?`)) {
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/institution/batches/${batchId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete batch")
      }

      setSuccess("Batch deleted successfully")
      fetchBatches()
    } catch (err: any) {
      setError(err.message || "Failed to delete batch")
    } finally {
      setLoading(false)
    }
  }

  const filteredBatches = batches.filter((batch) =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (tableNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/institution-dashboard')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Batch Management
                </h1>
                <p className="text-gray-600 mt-1">Setup required</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-full bg-blue-100 p-6">
                  <FolderOpen className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">Database Setup Required</h2>
                  <p className="text-gray-600 mb-6 max-w-lg mx-auto">
                    The batch management system needs to be initialized. Please run the database migration script to create the necessary tables.
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                    <p className="text-sm font-medium text-gray-700 mb-2">Script to run:</p>
                    <code className="text-sm bg-slate-900 text-green-400 px-3 py-2 rounded block font-mono">
                      007_create_batches_tables.sql
                    </code>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Look for the "Run Script" button in the v0 scripts panel to execute this migration.
                  </p>
                </div>
                <Button onClick={() => router.push('/institution-dashboard')} size="lg" variant="outline">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (loading && batches.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading batches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <InstitutionNavbar />
      
      {/* Header */}
      <div className="pt-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Batch Management
                </h1>
                <p className="text-gray-600 mt-1">Create and organize student batches</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Batch
            </Button>
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

        {/* Create Batch Form */}
        {showCreateForm && (
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Create New Batch
              </CardTitle>
              <CardDescription>Organize students into batches for better management</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBatch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name *</label>
                  <Input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g., Computer Science 2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <Textarea
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    placeholder="Add a description for this batch..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? "Creating..." : "Create Batch"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Stats Card */}
        <Card className="border-0 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{batches.length}</p>
                  <p className="text-sm text-gray-600">Total Batches</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {batches.reduce((sum, batch) => sum + batch.member_count, 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Members</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {batches.length > 0
                      ? Math.round(batches.reduce((sum, batch) => sum + batch.member_count, 0) / batches.length)
                      : 0}
                  </p>
                  <p className="text-sm text-gray-600">Avg. Members/Batch</p>
                </div>
              </div>
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
                placeholder="Search batches by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.length === 0 ? (
            <div className="col-span-full">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-12">
                  <div className="text-center text-gray-500">
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">
                      {searchQuery ? "No batches found" : "No batches created yet"}
                    </p>
                    <p className="text-sm mt-2">
                      {searchQuery ? "Try a different search term" : "Create your first batch to get started"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredBatches.map((batch) => (
              <Card
                key={batch.id}
                className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => router.push(`/institution-dashboard/batches/${batch.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {batch.name}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {batch.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      <Users className="w-3 h-3 mr-1" />
                      {batch.member_count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {new Date(batch.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/institution-dashboard/batches/${batch.id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBatch(batch.id, batch.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
