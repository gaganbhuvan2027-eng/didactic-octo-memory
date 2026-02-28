"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Calendar, Clock, Users, Plus, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { streams } from "@/lib/courses"

interface Batch {
  id: string
  name: string
  description: string
  batch_members: Array<{ user_id: string }>
}

interface Member {
  id: string
  name: string
  email: string
}

interface ScheduledInterview {
  id: string
  member_id: string
  course: string
  difficulty: string
  scheduled_date: string
  status: string
  duration?: number
  deadline?: string | null
  member: {
    id: string
    name: string
    email: string
  }
  scheduled_by: {
    name: string
  }
}

export default function ScheduleInterviewClient() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [batches, setBatches] = useState<Batch[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)

  const [selectedBatch, setSelectedBatch] = useState("")
  const [course, setCourse] = useState("frontend-react") // Will be set to first available course
  const [difficulty, setDifficulty] = useState("intermediate")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [deadlineDate, setDeadlineDate] = useState("")
  const [deadlineTime, setDeadlineTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState<number>(30)

  // Generate course categories from lib/courses.ts streams
  const courseCategories = streams.map(stream => ({
    category: stream.title,
    courses: stream.subcourses.map(subcourse => ({
      value: `${stream.id}-${subcourse.id}`,
      label: `${stream.title.replace(' Development', '').replace(' & ML', '').replace(' & Problem Solving', '').replace(' Test', '')} - ${subcourse.name}`
    }))
  }))

  // Add special categories
  courseCategories.push({
    category: "Other",
    courses: [
      { value: "hr", label: "HR/Behavioral" },
      { value: "custom", label: "Custom Scenario" },
    ],
  })

  // Flatten courses for easy lookup
  const allCourses = courseCategories.flatMap((cat) => cat.courses)

  // Difficulty levels by course type (voice interviews have 4 levels, DSA/Aptitude have 3)
  const getDifficultiesForCourse = (courseValue: string) => {
    const isCodeOrAptitude = courseValue.startsWith("dsa-") || courseValue.startsWith("aptitude-")
    
    if (isCodeOrAptitude) {
      return [
        { value: "easy", label: "Easy", color: "bg-green-100 text-green-700" },
        { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-700" },
        { value: "hard", label: "Hard", color: "bg-red-100 text-red-700" },
      ]
    }
    
    // Voice interviews have 4 levels
    return [
      { value: "beginner", label: "Beginner", color: "bg-green-100 text-green-700" },
      { value: "intermediate", label: "Intermediate", color: "bg-blue-100 text-blue-700" },
      { value: "advanced", label: "Advanced", color: "bg-orange-100 text-orange-700" },
      { value: "expert", label: "Expert", color: "bg-red-100 text-red-700" },
    ]
  }

  // Duration options by course type (DSA/Aptitude max 45 min, Voice interviews max 60 min)
  const getDurationOptionsForCourse = (courseValue: string) => {
    const isCodeOrAptitude = courseValue.startsWith("dsa-") || courseValue.startsWith("aptitude-")
    
    if (isCodeOrAptitude) {
      return [
        { value: 15, label: "15 minutes" },
        { value: 30, label: "30 minutes" },
        { value: 45, label: "45 minutes" },
      ]
    }
    
    // Voice interviews
    return [
      { value: 15, label: "15 minutes" },
      { value: 30, label: "30 minutes" },
      { value: 45, label: "45 minutes" },
      { value: 60, label: "60 minutes" },
    ]
  }

  // Legacy duration options for current selection
  const durationOptions = getDurationOptionsForCourse(course)

  // Legacy difficulties array for display
  const difficulties = getDifficultiesForCourse(course)

  const searchParams = useSearchParams()

  useEffect(() => {
    fetchBatches()
    fetchMembers()
    fetchScheduledInterviews()

    const batchParam = searchParams.get('batchId')
    if (batchParam) {
      setSelectedBatch(batchParam)
      setShowScheduleForm(true)
    }
  }, [searchParams])

  const fetchBatches = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: userProfile } = await supabase.from("users").select("institution_id").eq("id", user.id).single()

      if (!userProfile) return

      const { data: batchesData } = await supabase
        .from("batches")
        .select("id, name, description, batch_members(user_id)")
        .eq("institution_id", userProfile.institution_id)

      setBatches(batchesData || [])
    } catch (error) {
      console.error("Error fetching batches:", error)
    }
  }

  const fetchMembers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: userProfile } = await supabase.from("users").select("institution_id").eq("id", user.id).single()

      if (!userProfile) return

      const { data: institutionMembers } = await supabase
        .from("institution_members")
        .select("*, users:user_id(id, email, name)")
        .eq("institution_id", userProfile.institution_id)

      const membersList = institutionMembers?.map((m: any) => ({
        id: m.users.id,
        name: m.users.name || "Unknown",
        email: m.users.email,
      }))

      setMembers(membersList || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const fetchScheduledInterviews = async () => {
    try {
      const response = await fetch("/api/institution/schedule/list")
      if (response.ok) {
        const data = await response.json()
        setScheduledInterviews(data.interviews || [])
      }
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error)
    }
  }

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      if (!selectedBatch || !scheduledDate || !scheduledTime) {
        setError("Please fill in all required fields")
        setLoading(false)
        return
      }

      if (deadlineDate && deadlineTime) {
        const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)
        const deadlineDateTime = new Date(`${deadlineDate}T${deadlineTime}:00`)
        
        if (deadlineDateTime <= scheduleDateTime) {
          setError("Deadline must be after the scheduled interview time")
          setLoading(false)
          return
        }
      }

      const batch = batches.find((b) => b.id === selectedBatch)
      if (!batch || !batch.batch_members || batch.batch_members.length === 0) {
        setError("Selected batch has no members")
        setLoading(false)
        return
      }

      const dateTime = `${scheduledDate}T${scheduledTime}:00`
      const deadlineDateTime = deadlineDate && deadlineTime ? `${deadlineDate}T${deadlineTime}:00` : null

      let successCount = 0
      let failCount = 0

      for (const member of batch.batch_members) {
        try {
          const response = await fetch("/api/institution/schedule/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              memberId: member.user_id,
              course,
              difficulty,
              scheduledDate: dateTime,
              deadline: deadlineDateTime,              duration: durationMinutes,            }),
          })

          if (response.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch (err) {
          failCount++
        }
      }

      if (successCount > 0) {
        setSuccess(`Successfully scheduled ${successCount} interview(s)${failCount > 0 ? ` (${failCount} failed)` : ""}`)
      } else {
        setError("Failed to schedule interviews for batch members")
      }

      setSelectedBatch("")
      setScheduledDate("")
      setScheduledTime("")
      setDeadlineDate("")
      setDeadlineTime("")
      setDurationMinutes(30)
      setShowScheduleForm(false)
      fetchScheduledInterviews()
    } catch (err: any) {
      setError(err.message || "Failed to schedule interview")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled interview?")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/institution/schedule/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete schedule")
      }

      setSuccess("Schedule deleted successfully")
      fetchScheduledInterviews()
    } catch (err: any) {
      setError(err.message || "Failed to delete schedule")
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getDifficultyColor = (diff: string) => {
    const found = difficulties.find((d) => d.value === diff)
    return found?.color || "bg-gray-100 text-gray-700"
  }

  const upcomingInterviews = scheduledInterviews.filter((i) => {
    const scheduleDate = new Date(i.scheduled_date)
    return scheduleDate >= new Date() && i.status === "pending"
  })

  const pastInterviews = scheduledInterviews.filter((i) => {
    const scheduleDate = new Date(i.scheduled_date)
    return scheduleDate < new Date() || i.status !== "pending"
  })

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
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Interview Scheduling
                </h1>
                <p className="text-gray-600 mt-1">Schedule interviews for entire batches at once</p>
              </div>
            </div>
            <Button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              Schedule Interview
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Schedule Form */}
        {showScheduleForm && (
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Create New Schedule
              </CardTitle>
              <CardDescription>Select a batch and configure the interview details for all members</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScheduleInterview} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Select Batch *
                    </label>
                    <select
                      value={selectedBatch}
                      onChange={(e) => setSelectedBatch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Choose a batch...</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name} ({batch.batch_members?.length || 0} members)
                        </option>
                      ))}
                    </select>
                    {selectedBatch && (
                      <p className="text-xs text-gray-500 mt-2">
                        This will schedule interviews for all {batches.find((b) => b.id === selectedBatch)?.batch_members?.length || 0} members in this batch
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Interview Date *
                    </label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Interview Time *
                    </label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Deadline Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      min={scheduledDate || new Date().toISOString().split("T")[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      After this time, the interview will expire and cannot be started
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Deadline Time (Optional)
                    </label>
                    <Input
                      type="time"
                      value={deadlineTime}
                      onChange={(e) => setDeadlineTime(e.target.value)}
                      disabled={!deadlineDate}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Course/Topic</label>
                    <select
                      value={course}
                      onChange={(e) => {
                        setCourse(e.target.value)
                        // Reset difficulty when course changes
                        const newDiffs = getDifficultiesForCourse(e.target.value)
                        if (!newDiffs.find(d => d.value === difficulty)) {
                          setDifficulty(newDiffs[0].value)
                        }
                        // Reset duration if it exceeds the new max
                        const newDurations = getDurationOptionsForCourse(e.target.value)
                        if (!newDurations.find(d => d.value === durationMinutes)) {
                          setDurationMinutes(newDurations[newDurations.length - 1].value)
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {courseCategories.map((cat) => (
                        <optgroup key={cat.category} label={cat.category}>
                          {cat.courses.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {getDifficultiesForCourse(course).map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.startsWith("dsa-") || course.startsWith("aptitude-") 
                        ? "3 levels available for DSA/Aptitude" 
                        : "4 levels available for voice interviews"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <select
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {getDurationOptionsForCourse(course).map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {course.startsWith("dsa-") || course.startsWith("aptitude-") 
                        ? "Max 45 min for DSA/Aptitude" 
                        : "Max 60 min for voice interviews"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? "Scheduling..." : "Schedule for Batch"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowScheduleForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Scheduled Interviews Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1">
            <TabsTrigger value="upcoming" className="gap-2">
              <Clock className="w-4 h-4" />
              Upcoming ({upcomingInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <Calendar className="w-4 h-4" />
              Past ({pastInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Users className="w-4 h-4" />
              All ({scheduledInterviews.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Interviews */}
          <TabsContent value="upcoming">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription>Scheduled interviews that haven't occurred yet</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingInterviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No upcoming interviews</p>
                    <p className="text-sm mt-2">Schedule interviews for your members to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {interview.member?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{interview.member?.name || "Unknown"}</p>
                                <p className="text-sm text-gray-500">{interview.member?.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Duration: <span className="font-medium text-gray-900">{interview.duration ? `${interview.duration} mins` : '30 mins'}</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(interview.scheduled_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(interview.scheduled_date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Course</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {allCourses.find((c) => c.value === interview.course)?.label || interview.course}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                                <Badge className={getDifficultyColor(interview.difficulty)}>
                                  {interview.difficulty}
                                </Badge>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(interview.status)}
                                  <Badge className={getStatusBadge(interview.status)}>{interview.status}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleDeleteSchedule(interview.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Past Interviews */}
          <TabsContent value="past">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Past Interviews</CardTitle>
                <CardDescription>Completed or expired scheduled interviews</CardDescription>
              </CardHeader>
              <CardContent>
                {pastInterviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No past interviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastInterviews.map((interview) => (
                      <div key={interview.id} className="p-5 border border-gray-200 rounded-lg bg-gray-50 opacity-75">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold">
                                {interview.member?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{interview.member?.name || "Unknown"}</p>
                                <p className="text-sm text-gray-500">{interview.member?.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Duration: <span className="font-medium text-gray-900">{interview.duration ? `${interview.duration} mins` : '30 mins'}</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(interview.scheduled_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(interview.scheduled_date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Course</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {allCourses.find((c) => c.value === interview.course)?.label || interview.course}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                                <Badge className={getDifficultyColor(interview.difficulty)}>
                                  {interview.difficulty}
                                </Badge>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(interview.status)}
                                  <Badge className={getStatusBadge(interview.status)}>{interview.status}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleDeleteSchedule(interview.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Interviews */}
          <TabsContent value="all">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>All Scheduled Interviews</CardTitle>
                <CardDescription>Complete list of all scheduled interviews</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledInterviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No scheduled interviews</p>
                    <p className="text-sm mt-2">Create your first schedule to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledInterviews.map((interview) => (
                      <div
                        key={interview.id}
                        className="p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {interview.member?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{interview.member?.name || "Unknown"}</p>
                                <p className="text-sm text-gray-500">{interview.member?.email}</p>
                                <p className="text-xs text-gray-500 mt-1">Duration: <span className="font-medium text-gray-900">{interview.duration ? `${interview.duration} mins` : '30 mins'}</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(interview.scheduled_date).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(interview.scheduled_date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Course</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {allCourses.find((c) => c.value === interview.course)?.label || interview.course}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                                <Badge className={getDifficultyColor(interview.difficulty)}>
                                  {interview.difficulty}
                                </Badge>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500 mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(interview.status)}
                                  <Badge className={getStatusBadge(interview.status)}>{interview.status}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleDeleteSchedule(interview.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

