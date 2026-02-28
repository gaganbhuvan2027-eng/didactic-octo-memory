"use client"

import { useState, useEffect } from "react"

interface AnalysisData {
  overall_score: number
  communication_score: number
  technical_score: number
  dsa_score?: number // Added for DSA interviews
  logical_reasoning_score?: number // Added for Aptitude interviews
  problem_solving_score: number
  confidence_score: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
  total_questions?: number
  answered_questions?: number
  correct_answers_count?: string
  wrong_answers_count?: number
  not_answered_questions_count?: number // Added
}

interface ResultsOverviewProps {
  analysis: AnalysisData
  interviewType?: string // Added
}

export default function ResultsOverview({ analysis, interviewType = "technical" }: ResultsOverviewProps) {
  const [animatedScores, setAnimatedScores] = useState<number[]>([])

  const isSkillOnly = (interviewType || '').startsWith('dsa') || (interviewType || '').startsWith('aptitude') || interviewType === 'problem_solving' || interviewType === 'problem-solving'

  // Other interviews: HR, Warmup, Salary Negotiation - no technical metrics
  const isOtherInterview = (interviewType || '').startsWith('other-')

  const getTechnicalScoreLabel = () => {
    if (interviewType === "dsa") return "DSA Skills"
    if (interviewType === "aptitude") return "Logical Reasoning"
    return "Technical Knowledge"
  }

  const getTechnicalScoreValue = () => {
    if (interviewType === "dsa") return analysis.dsa_score || analysis.technical_score
    if (interviewType === "aptitude") return analysis.logical_reasoning_score || analysis.technical_score
    return analysis.technical_score
  }

  const scoreCards = isOtherInterview
    ? [
        {
          title: "Communication",
          score: analysis.communication_score,
          maxScore: 100,
          color: "from-yellow-600 to-yellow-400",
          benchmark: "Clarity and articulation",
        },
        {
          title: "Confidence",
          score: analysis.confidence_score,
          maxScore: 100,
          color: "from-emerald-600 to-emerald-400",
          benchmark: "Poise and self-assurance",
        },
        {
          title: "Response Quality",
          score: analysis.problem_solving_score ?? analysis.overall_score,
          maxScore: 100,
          color: "from-blue-600 to-blue-400",
          benchmark: "How well you addressed each question",
        },
      ]
    : [
        {
          title: getTechnicalScoreLabel(),
          score: getTechnicalScoreValue(),
          maxScore: 100,
          color: "from-purple-600 to-purple-400",
          benchmark: "Industry avg: 65%",
        },
        {
          title: "Problem Solving",
          score: analysis.problem_solving_score,
          maxScore: 100,
          color: "from-indigo-600 to-indigo-400",
          benchmark: "Industry avg: 60%",
        },
        ...(!isSkillOnly
          ? [
              {
                title: "Communication",
                score: analysis.communication_score,
                maxScore: 100,
                color: "from-yellow-600 to-yellow-400",
                benchmark: "Industry avg: 72%",
              },
            ]
          : []),
      ]

  useEffect(() => {
    // Animate scores on mount
    setAnimatedScores(Array(scoreCards.length).fill(0))
    const timers = scoreCards.map((card, index) => {
      return setTimeout(() => {
        setAnimatedScores((prev) => {
          const newScores = [...prev]
          newScores[index] = card.score
          return newScores
        })
      }, index * 200)
    })

    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [analysis, interviewType])

  return (
    <div className="mb-12 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoreCards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
          >
            {/* Circular Progress Indicator */}
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-6">
                {/* Background circle */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                  {/* Animated progress circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeDasharray={`${(animatedScores[index] / card.maxScore) * 339.29} 339.29`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Score text in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{animatedScores[index]}</div>
                    <div className="text-sm text-gray-500">/ {card.maxScore}</div>
                  </div>
                </div>
              </div>

              {/* Card Title */}
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 text-center">{card.benchmark}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
