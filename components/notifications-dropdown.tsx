"use client"

import { useState, useEffect } from "react"
import { Bell, Calendar, Clock, Book, AlertCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface ScheduledInterview {
  id: string
  course: string
  difficulty: string
  scheduled_date: string
  deadline?: string // Added deadline field
  duration?: number // minutes
  institution: { name: string }
  batch: { name: string }
  scheduled_by: { name: string }
}

export function NotificationsDropdown() {
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchScheduledInterviews()
    // Poll for new scheduled interviews every 30 seconds
    const interval = setInterval(fetchScheduledInterviews, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchScheduledInterviews = async () => {
    try {
      const response = await fetch("/api/user/scheduled-interviews")
      if (response.ok) {
        const data = await response.json()
        setScheduledInterviews(data.interviews || [])
      }
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const isExpired = (interview: ScheduledInterview) => {
    if (!interview.deadline) return false
    return new Date() > new Date(interview.deadline)
  }

  const handleStartInterview = async (interview: ScheduledInterview) => {
    if (isExpired(interview)) {
      alert("This interview has expired and can no longer be started")
      return
    }

    try {
      const response = await fetch("/api/user/start-scheduled-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: interview.id }),
      })

      if (response.ok) {
        const data = await response.json()
        const params = new URLSearchParams({
          scheduled: 'true',
          scheduleId: interview.id,
          difficulty: interview.difficulty,
          duration: interview.duration ? String(interview.duration) : '30'
        })
        
        // Route to appropriate interview page based on course type
        if (interview.course.includes("hr") || interview.course.includes("behavioral")) {
          router.push(`/interview/hr?${params.toString()}`)
        } else if (interview.course.includes("technical") || interview.course.includes("/")) {
          router.push(`/interview/course/${interview.course}?${params.toString()}`)
        } else {
          router.push(`/interview/technical?${params.toString()}`)
        }
      }
    } catch (error) {
      console.error("Error starting interview:", error)
    }
  }

  const unreadCount = scheduledInterviews.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Scheduled Interviews
          </h3>
          <p className="text-sm text-gray-600 mt-1">Your upcoming interview sessions</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Loading...</p>
            </div>
          ) : scheduledInterviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No scheduled interviews</p>
              <p className="text-sm mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {scheduledInterviews.map((interview) => {
                const scheduleDate = new Date(interview.scheduled_date)
                const isToday = scheduleDate.toDateString() === new Date().toDateString()
                const isWithin24Hours = scheduleDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                const expired = isExpired(interview) // Check expiry

                return (
                  <div key={interview.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Book className="w-4 h-4 text-blue-600" />
                          <p className="font-semibold text-gray-900">{interview.course}</p>
                        </div>
                        <p className="text-sm text-gray-600">{interview.institution?.name}</p>
                        {interview.batch && (
                          <p className="text-xs text-gray-500 mt-1">Batch: {interview.batch.name}</p>
                        )}
                      </div>
                      <Badge
                        className={
                          interview.difficulty === "beginner"
                            ? "bg-green-100 text-green-700"
                            : interview.difficulty === "intermediate"
                              ? "bg-blue-100 text-blue-700"
                              : interview.difficulty === "advanced"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                        }
                      >
                        {interview.difficulty}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{scheduleDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {scheduleDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{(interview.duration ?? 30) + " mins"}</span>
                      </div>
                    </div>

                    {interview.deadline && (
                      <div className="mb-3 flex items-center gap-1">
                        <AlertCircle className={`w-3 h-3 ${expired ? 'text-red-600' : 'text-orange-600'}`} />
                        <span className={`text-xs ${expired ? 'text-red-600' : 'text-orange-600'}`}>
                          {expired ? 'Expired' : `Deadline: ${new Date(interview.deadline).toLocaleString()}`}
                        </span>
                      </div>
                    )}

                    {(isToday || isWithin24Hours) && !expired && (
                      <Button
                        onClick={() => handleStartInterview(interview)}
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Start Interview
                      </Button>
                    )}

                    {expired && (
                      <div className="text-xs text-red-600 text-center font-medium">
                        ⚠️ This interview has expired
                      </div>
                    )}

                    {!isToday && !isWithin24Hours && !expired && (
                      <p className="text-xs text-gray-500 text-center">
                        Available {Math.ceil((scheduleDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}{" "}
                        days before scheduled time
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {scheduledInterviews.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => router.push("/dashboard#scheduled")}
            >
              View All Scheduled Interviews
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
