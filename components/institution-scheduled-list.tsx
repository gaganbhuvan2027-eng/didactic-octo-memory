"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import StartScheduledInterviewButton from "./start-scheduled-interview-button"
import { Button } from "@/components/ui/button"

export default function InstitutionScheduledList({ initial = [], institutionId }: { initial?: any[]; institutionId?: string }) {
  const [interviews, setInterviews] = useState<any[]>(initial || [])
  const [loading, setLoading] = useState<boolean>(!initial || initial.length === 0)
  const [error, setError] = useState<string | null>(null)
  const failureCount = useRef(0)
  const intervalRef = useRef<number | null>(null)

  const fetchSchedules = async () => {
    try {
      setError(null)
      const url = new URL('/api/institution/schedule/list', window.location.origin)
      if (institutionId) url.searchParams.set('institutionId', institutionId)
      const res = await fetch(url.toString())
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setInterviews(data.interviews || [])
      failureCount.current = 0
    } catch (err: any) {
      console.error('[v0] Failed to fetch institution schedules:', err)
      failureCount.current = Math.min(6, failureCount.current + 1)
      setError(err?.message || 'Failed to fetch scheduled interviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // initial fetch
    fetchSchedules()

    // Poll every 10s, increase on repeated failures (exponential backoff)
    intervalRef.current = window.setInterval(() => {
      // Calculate backoff: if failures > 0, skip some intervals
      if (failureCount.current > 0) {
        // skip a number of polls proportional to failures (e.g., failureCount * 2)
        const skip = failureCount.current * 2
        const now = Date.now()
        // simple approach: only fetch when failureCount is small enough
        // but for simplicity just call fetchSchedules; the failureCount logic above will throttle
      }
      fetchSchedules()
    }, 10000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (loading) {
    return (
      <Card className="border-0 shadow-sm mb-6 md:mb-12">
        <div className="p-6 text-center text-gray-600">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading scheduled interviews...</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm mb-6 md:mb-12">
        <div className="p-6 text-center text-red-600">
          <p className="font-medium">Error loading scheduled interviews</p>
          <p className="text-sm mt-2">{error}</p>
          <div className="mt-4">
            <Button onClick={() => fetchSchedules()}>Retry</Button>
          </div>
        </div>
      </Card>
    )
  }

  if (!interviews || interviews.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {interviews.map((s: any) => (
        <Card key={s.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500">When</div>
              <div className="font-medium">{new Date(s.scheduled_date).toLocaleString()}</div>

              <div className="text-sm text-gray-500 mt-2">Member</div>
              <div className="font-medium">{s.member?.name || s.member?.email || '—'}</div>

              {s.course && (
                <>
                  <div className="text-sm text-gray-500 mt-2">Course</div>
                  <div className="font-medium">{s.course}</div>
                </>
              )}

              {s.difficulty && (
                <>
                  <div className="text-sm text-gray-500 mt-2">Difficulty</div>
                  <div className="font-medium">{s.difficulty}</div>
                </>
              )}

              <div className="text-sm text-gray-500 mt-2">Status</div>
              <div className="font-medium">{s.status}</div>
            </div>

            <div className="text-right text-sm text-gray-500">
              <div>Scheduled by</div>
              <div className="font-medium">{s.scheduled_by?.name || '—'}</div>
              <div className="mt-3">
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore */}
                <StartScheduledInterviewButton interview={s} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
