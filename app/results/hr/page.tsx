"use client"

import DashboardNavbar from "@/components/dashboard-navbar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { downloadInterviewReport } from "@/utils/download-report"

export default function HRResultsPage() {
  const router = useRouter()

  const mockAnalysis = {
    overall_score: 86,
    communication_score: 90,
    technical_score: 0, // Not applicable
    problem_solving_score: 78, // Using Conflict Resolution as proxy
    confidence_score: 90, // Emotional Intelligence as proxy
    detailed_feedback: `Excellent communication skills and strong storytelling ability when discussing past experiences. You effectively used the STAR method in most responses. Your enthusiasm for the role came through clearly.
    
Consider providing more specific metrics when discussing achievements—quantify your impact where possible.
    
Your body language and tone conveyed confidence. Work on being more concise in your answers; aim for 2-3 minutes per response to maintain engagement.`,
    strengths: ["Communication", "Storytelling", "Enthusiasm", "Emotional Intelligence", "Teamwork"],
    improvements: ["Specific metrics", "Conciseness", "Conflict Resolution"],
    interviewType: "HR Interview"
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">HR Interview Analysis</h1>
          <p className="text-lg text-gray-600">Comprehensive evaluation of your behavioral interview performance.</p>
        </div>

        {/* HR Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient1)"
                    strokeWidth="8"
                    strokeDasharray="305 339.29"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">90</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient2)"
                    strokeWidth="8"
                    strokeDasharray="278 339.29"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">82</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cultural Fit</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient3)"
                    strokeWidth="8"
                    strokeDasharray="292 339.29"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">86</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Leadership Potential</h3>
            </div>
          </div>
        </div>

        {/* AI Feedback for HR */}
        <div className="mb-12 bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Behavioral Feedback</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            Excellent communication skills and strong storytelling ability when discussing past experiences. You
            effectively used the STAR method in most responses. Your enthusiasm for the role came through clearly.
            Consider providing more specific metrics when discussing achievements—quantify your impact where possible.
            Your body language and tone conveyed confidence. Work on being more concise in your answers; aim for 2-3
            minutes per response to maintain engagement.
          </p>
          <div className="flex gap-4">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg"
              onClick={() => downloadInterviewReport(mockAnalysis, "HR Interview")}
            >
              Download HR Report
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Behavioral Competencies */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Behavioral Competencies</h2>
          <div className="space-y-6">
            {[
              { competency: "Teamwork & Collaboration", score: 92 },
              { competency: "Adaptability", score: 85 },
              { competency: "Conflict Resolution", score: 78 },
              { competency: "Time Management", score: 88 },
              { competency: "Emotional Intelligence", score: 90 },
            ].map((item) => (
              <div key={item.competency}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.competency}</span>
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
