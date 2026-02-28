"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import CustomScenarioBuilder, { type CustomScenario } from "@/components/custom-scenario-builder"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import { CUSTOM_SCENARIO_KEY } from "@/lib/custom-interview"

const durations = [
  { value: 5, label: "5 mins" },
  { value: 15, label: "15 mins" },
  { value: 30, label: "30 mins" },
]

const interviewers = [
  { id: "claire", name: "Claire" },
]

export default function CustomInterviewPage() {
  const router = useRouter()
  const [selectedDuration, setSelectedDuration] = useState(15)
  const [selectedInterviewer, setSelectedInterviewer] = useState("claire")

  const handleComplete = (scenario: CustomScenario) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(CUSTOM_SCENARIO_KEY, JSON.stringify(scenario))
    }
    const params = new URLSearchParams({
      duration: String(selectedDuration),
      difficulty: "beginner",
      interviewer: selectedInterviewer,
      audio: "true",
      video: "true",
    })
    router.push(`/interview/custom/start?${params.toString()}`)
  }

  const handleBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <CustomScenarioBuilder onComplete={handleComplete} onBack={handleBack} />

        {/* Interview settings */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-900">Interview Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Duration</Label>
              <div className="flex gap-2">
                {durations.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setSelectedDuration(d.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedDuration === d.value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Interviewer</Label>
              <div className="flex gap-2">
                {interviewers.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => setSelectedInterviewer(i.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedInterviewer === i.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
