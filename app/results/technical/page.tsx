"use client"

import DashboardNavbar from "@/components/dashboard-navbar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function TechnicalResultsPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Technical Interview Analysis</h1>
          <p className="text-lg text-gray-600">Detailed performance breakdown of your technical interview.</p>
        </div>

        {/* Technical Score Cards */}
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
                    strokeDasharray="282 339.29"
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
                    <div className="text-4xl font-bold text-gray-900">85</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Technical Knowledge</h3>
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
                    strokeDasharray="298 339.29"
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
                    <div className="text-4xl font-bold text-gray-900">88</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Problem Solving</h3>
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
                    strokeDasharray="271 339.29"
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
                    <div className="text-4xl font-bold text-gray-900">80</div>
                    <div className="text-sm text-gray-500">/ 100</div>
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Code Quality</h3>
            </div>
          </div>
        </div>

        {/* AI Feedback for Technical */}
        <div className="mb-12 bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg transition-all">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Technical Feedback</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            Your technical knowledge is strong, particularly in data structures and algorithms. You demonstrated
            excellent problem-solving skills when breaking down complex problems. Consider improving your explanation of
            time complexity analysis—be more specific about Big O notation. Your code structure is clean, but you could
            benefit from discussing edge cases more thoroughly before diving into implementation. Overall, solid
            technical performance with room for growth in system design discussions.
          </p>
          <div className="flex gap-4">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg">
              Download Technical Report
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Technical Skills Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills Breakdown</h2>
          <div className="space-y-6">
            {[
              { skill: "Data Structures", score: 90 },
              { skill: "Algorithms", score: 85 },
              { skill: "System Design", score: 75 },
              { skill: "Code Optimization", score: 82 },
              { skill: "Debugging Approach", score: 88 },
            ].map((item) => (
              <div key={item.skill}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900">{item.skill}</span>
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
