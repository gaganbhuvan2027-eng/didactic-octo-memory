"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import InterviewRoom from "@/components/interview-room"
import { CUSTOM_SCENARIO_KEY } from "@/lib/custom-interview"
import type { CustomScenario } from "@/components/custom-scenario-builder"

export default function CustomInterviewStartPage() {
  const router = useRouter()
  const [customScenario, setCustomScenario] = useState<CustomScenario | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = sessionStorage.getItem(CUSTOM_SCENARIO_KEY)
      if (!stored) {
        setError("No custom scenario found. Please go back and create your interview scenario.")
        return
      }
      const scenario = JSON.parse(stored) as CustomScenario
      if (!scenario?.description) {
        setError("Invalid scenario. Please go back and create your interview scenario.")
        return
      }
      setCustomScenario(scenario)
      // Clear after reading so refresh doesn't reuse stale data
      sessionStorage.removeItem(CUSTOM_SCENARIO_KEY)
    } catch {
      setError("Failed to load your scenario. Please go back and try again.")
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push("/interview/custom")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Create Custom Interview
          </button>
        </div>
      </div>
    )
  }

  if (!customScenario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your custom interview...</p>
        </div>
      </div>
    )
  }

  return (
    <InterviewRoom
      interviewType="custom"
      courseTitle="Custom Interview"
      customScenario={customScenario}
    />
  )
}
