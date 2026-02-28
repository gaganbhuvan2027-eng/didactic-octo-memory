"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Book, Play, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

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

export function ScheduledInterviewsSection() {
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchScheduledInterviews()
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

  const getTimeUntilDeadline = (deadline: string) => {
    const deadlineTime = new Date(deadline)
    const now = new Date()
    const diff = deadlineTime.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? "s" : ""} left`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    }
    return `${minutes}m left`
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
          scheduled: "true",
          scheduleId: interview.id,
          difficulty: interview.difficulty,
          duration: interview.duration ? String(interview.duration) : "30",
        })

        // Route to appropriate interview page based on course type
        if (interview.course.includes("hr") || interview.course.includes("behavioral")) {
          router.push(`/interview/hr?${params.toString()}`)
        } else if (interview.course.startsWith("dsa-") || interview.course.startsWith("aptitude")) {
          // DSA and aptitude interviews use the code-based interviewer
          router.push(`/interview/${interview.course}?${params.toString()}`)
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

  if (loading) {
    return (
      <Card className="border-0 shadow-sm mb-6 md:mb-12">
        <CardContent className="p-4 md:p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (scheduledInterviews.length === 0) {
    return null
  }

  return (
    <Card className="border-0 shadow-sm mb-6 md:mb-12" id="scheduled">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          Scheduled Interviews
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Your upcoming interview sessions scheduled by your institution
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="space-y-3 md:space-y-4">
          {scheduledInterviews.map((interview) => {
            const scheduleDate = new Date(interview.scheduled_date)
            const isToday = scheduleDate.toDateString() === new Date().toDateString()
            const isWithin24Hours = scheduleDate.getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
            const isPast = scheduleDate < new Date()
            const expired = isExpired(interview) // Check expiry status

            return (
              <div
                key={interview.id}
                className="p-4 md:p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all bg-white"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                      <Book className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 text-base md:text-lg">{interview.course}</h3>
                      <Badge
                        className={
                          interview.difficulty === "beginner"
                            ? "bg-green-100 text-green-700 text-xs"
                            : interview.difficulty === "intermediate"
                              ? "bg-blue-100 text-blue-700 text-xs"
                              : interview.difficulty === "advanced"
                                ? "bg-orange-100 text-orange-700 text-xs"
                                : "bg-red-100 text-red-700 text-xs"
                        }
                      >
                        {interview.difficulty}
                      </Badge>
                    </div>

                    <p className="text-xs md:text-sm text-gray-600 mb-1">{interview.institution?.name}</p>
                    {interview.batch && (
                      <p className="text-xs text-gray-500 mb-2 md:mb-3">Batch: {interview.batch.name}</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs md:text-sm">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="font-medium">{scheduleDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="font-medium">
                          {scheduleDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="font-medium">{(interview.duration ?? 30) + " mins"}</span>
                      </div>
                    </div>

                    {interview.deadline && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertCircle
                          className={`w-3 h-3 md:w-4 md:h-4 ${expired ? "text-red-600" : "text-orange-600"}`}
                        />
                        <span className={`text-xs font-medium ${expired ? "text-red-600" : "text-orange-600"}`}>
                          {expired ? "Expired" : `Expires in ${getTimeUntilDeadline(interview.deadline)}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {(isToday || isWithin24Hours) && !isPast && !expired && (
                      <Button
                        onClick={() => handleStartInterview(interview)}
                        className="bg-blue-600 hover:bg-blue-700 gap-2 text-sm w-full md:w-auto"
                      >
                        <Play className="w-3 h-3 md:w-4 md:h-4" />
                        Start Interview
                      </Button>
                    )}
                    {!isToday && !isWithin24Hours && !isPast && !expired && (
                      <Badge variant="outline" className="text-gray-600 text-xs justify-center">
                        Starts in {Math.ceil((scheduleDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}{" "}
                        days
                      </Badge>
                    )}
                    {(isPast || expired) && (
                      <Badge variant="outline" className="text-red-600 border-red-200 text-xs justify-center">
                        Expired
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
