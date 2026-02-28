"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface AnalysisData {
  overall_score: number
  communication_score: number
  technical_score: number
  problem_solving_score: number
  confidence_score?: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
}

interface DetailedInsightsProps {
  analysis: AnalysisData
  interviewType?: string
}

export default function DetailedInsights({ analysis, interviewType = 'technical' }: DetailedInsightsProps) {
  const isSkillOnly = (interviewType || '').startsWith('dsa') || (interviewType || '').startsWith('aptitude') || interviewType === 'problem_solving' || interviewType === 'problem-solving'

  const metricsData = isSkillOnly
    ? [
        { label: "Technical Knowledge", score: analysis.technical_score / 10, maxScore: 10 },
        { label: "Problem Solving", score: analysis.problem_solving_score / 10, maxScore: 10 },
        { label: "Overall Performance", score: analysis.overall_score / 10, maxScore: 10 },
      ]
    : [
        { label: "Communication", score: analysis.communication_score / 10, maxScore: 10 },
        { label: "Technical Knowledge", score: analysis.technical_score / 10, maxScore: 10 },
        { label: "Problem Solving", score: analysis.problem_solving_score / 10, maxScore: 10 },
        { label: "Overall Performance", score: analysis.overall_score / 10, maxScore: 10 },
      ]

  // Declare performanceData variable
  const performanceData = isSkillOnly
    ? [
        { name: "Technical Knowledge", score: analysis.technical_score },
        { name: "Problem Solving", score: analysis.problem_solving_score },
        { name: "Overall Performance", score: analysis.overall_score },
      ]
    : [
        { name: "Communication", score: analysis.communication_score },
        { name: "Technical Knowledge", score: analysis.technical_score },
        { name: "Problem Solving", score: analysis.problem_solving_score },
        { name: "Overall Performance", score: analysis.overall_score },
      ]

  return (
    <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Detailed Insights</h2>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="score" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Key Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Metrics</h3>

          <div className="space-y-6">
            {metricsData.map((metric) => (
              <div key={metric.label}>
                {/* Metric Label */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">
                    {metric.label}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    {metric.score.toFixed(1)} / {metric.maxScore}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
