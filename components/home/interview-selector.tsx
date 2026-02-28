"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Briefcase, GraduationCap, Play } from "lucide-react"
import { roles, companies } from "@/lib/companies"
import { createClient } from "@/lib/supabase/client"

type InterviewMode = "job" | "internship"

export default function InterviewSelector() {
  const router = useRouter()
  const [mode, setMode] = useState<InterviewMode>("job")
  const [selectedPosition, setSelectedPosition] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedRound, setSelectedRound] = useState("")

  const handleInterviewAction = async (path: string) => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      window.location.href = "/auth"
      return
    }
    router.push(path || "/dashboard")
  }

  const handleStartPractice = async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      window.location.href = "/auth"
      return
    }
    // Require at least Position or Company
    if (!selectedPosition && !selectedCompany) {
      router.push("/interview-config")
      return
    }
    // Map selector rounds to route round types (role: technical/behavioral/coding/warmup; company: warmup/behavioral/coding)
    const roundMap: Record<string, string> = {
      technical: "technical",
      behavioral: "behavioral",
      hr: "behavioral",
      coding: "coding",
      "system-design": "technical",
    }
    // Company: no coding round - coding is role-only
    const companyRoundMap: Record<string, string> = {
      technical: "behavioral",
      behavioral: "behavioral",
      hr: "behavioral",
      coding: "behavioral",
      "system-design": "behavioral",
    }
    const baseRound = selectedRound || (selectedCompany ? "behavioral" : "technical")
    const roundType = selectedCompany
      ? (companyRoundMap[baseRound] || "behavioral")
      : (roundMap[baseRound] || "technical")
    const params = new URLSearchParams()
    params.set("duration", "15")
    params.set("difficulty", "beginner")
    params.set("round", roundType)
    params.set("interviewer", "claire")
    params.set("audio", "true")
    params.set("video", "true")
    const query = params.toString()
    if (selectedCompany && selectedPosition) {
      router.push(`/interview/company/${selectedCompany}/role/${selectedPosition}?${query}`)
    } else if (selectedCompany) {
      router.push(`/interview/company/${selectedCompany}/${roundType}?${query}`)
    } else {
      router.push(`/interview/role/${selectedPosition}/${roundType}?${query}`)
    }
  }

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-gray-600 text-lg">
            AI mock interviews with personalized practice and real-time analytics
          </p>
        </div>

        {/* Interview selector card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
          {/* Mode toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setMode("job")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  mode === "job"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Job
              </button>
              <button
                onClick={() => setMode("internship")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  mode === "internship"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Internship
              </button>
            </div>
          </div>

          {/* Dropdowns row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Position dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                Position
              </label>
              <div className="relative">
                <select
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Position</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Company dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                Company (Optional)
              </label>
              <div className="relative">
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">Any Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Round dropdown */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-500 mb-1.5 ml-1">
                Round
              </label>
              <div className="relative">
                <select
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">All Rounds</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="hr">HR</option>
                  {!selectedCompany && <option value="coding">Coding</option>}
                  <option value="system-design">System Design</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Start button */}
            <div className="flex items-end">
              <button
                onClick={handleStartPractice}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/25"
              >
                <Play className="w-4 h-4" />
                Start Practice
              </button>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleInterviewAction("/performance")}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                View Sample Analytics
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => handleInterviewAction("/dashboard/resume")}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Resume Analyzer
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
