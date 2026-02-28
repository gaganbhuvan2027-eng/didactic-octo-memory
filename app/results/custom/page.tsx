"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardNavbar from "@/components/dashboard-navbar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import { downloadInterviewReport } from "@/utils/download-report"

interface CustomAnalysis {
  overall_score: number
  scenario_handling_score: number
  adaptability_score: number
  communication_score: number
  problem_solving_score: number
  confidence_score: number
  detailed_feedback: string
  strengths: string[]
  improvements: string[]
}

export default function CustomResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const interviewId = searchParams.get("interviewId")
  const [analysis, setAnalysis] = useState<CustomAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      if (!interviewId) {
        setError("No interview ID provided")
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/interview/results?interviewId=${interviewId}`)
        
        if (response.ok) {
          const data = await response.json()
          const customAnalysis: CustomAnalysis = {
            overall_score: data.analysis.overall_score,
            scenario_handling_score: data.analysis.technical_score,
            adaptability_score: data.analysis.problem_solving_score,
            communication_score: data.analysis.communication_score,
            problem_solving_score: data.analysis.problem_solving_score,
            confidence_score: data.analysis.confidence_score,
            detailed_feedback: data.analysis.detailed_feedback,
            strengths: data.analysis.strengths,
            improvements: data.analysis.improvements,
          }
          setAnalysis(customAnalysis)
          setIsLoading(false)
        } else {
          setError("Failed to load results")
          setIsLoading(false)
        }
      } catch (err) {
        console.error("[v0] Error fetching custom results:", err)
        setError("Failed to load results")
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [interviewId])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-24 pb-16 px-4 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-900">Loading your results...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !analysis) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Results</h3>
            <p className="text-red-700">{error}</p>
            <Button onClick={() => router.push("/dashboard")} className="mt-4">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Custom Scenario Analysis</h1>
          <p className="text-lg text-gray-600">Performance evaluation for your custom interview scenario.</p>
        </div>

        {/* Custom Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: "Overall Performance", score: analysis.overall_score, gradient: "gradient1" },
            { label: "Scenario Handling", score: analysis.scenario_handling_score, gradient: "gradient2" },
            { label: "Adaptability", score: analysis.adaptability_score, gradient: "gradient3" },
          ].map((item, index) => {
            const circumference = 2 * Math.PI * 54
            const dashOffset = circumference - (item.score / 100) * circumference

            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col items-center">
                  <div className="relative w-32 h-32 mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke={`url(#${item.gradient})`}
                        strokeWidth="8"
                        strokeDasharray={`${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id={item.gradient} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#2563eb" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">{item.score}</div>
                        <div className="text-sm text-gray-500">/ 100</div>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.label}</h3>
                </div>
              </div>
            )
          })}
        </div>

        {/* AI Feedback */}
        <div className="mb-12 bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Custom Scenario Feedback</h2>
          <p className="text-gray-700 leading-relaxed mb-8 whitespace-pre-wrap">{analysis.detailed_feedback}</p>
          <div className="flex gap-4">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg"
              onClick={() => analysis && downloadInterviewReport(analysis, "Custom Scenario")}
            >
              Download Report
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Strengths</h3>
            <ul className="space-y-3">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-green-600 text-xl">✓</span>
                  <span className="text-gray-700">{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Areas for Improvement</h3>
            <ul className="space-y-3">
              {analysis.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl">→</span>
                  <span className="text-gray-700">{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Metrics</h2>
          <div className="space-y-6">
            {[
              { metric: "Communication", score: analysis.communication_score },
              { metric: "Problem Solving", score: analysis.problem_solving_score },
              { metric: "Adaptability", score: analysis.adaptability_score },
              { metric: "Confidence Level", score: analysis.confidence_score },
              { metric: "Scenario Handling", score: analysis.scenario_handling_score },
            ].map((item) => (
              <div key={item.metric}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.metric}</span>
                  <span className="font-bold text-blue-600">{item.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
