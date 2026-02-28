import { useState, useEffect } from "react"

interface AnalysisData {
  overall_score: number
  technical_score: number
  dsa_score?: number
  logical_reasoning_score?: number
  problem_solving_score: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
  correct_answers_count?: string // Added for correct answers
  total_questions?: number
  answered_questions?: number
  wrong_answers_count?: number
  not_answered_questions_count?: number // Added
}

interface DSAAptitudeResultsUIProps {
  analysis: AnalysisData
  interviewType?: string
}

export default function DSAAptitudeResultsUI({
  analysis,
  interviewType = "technical",
}: DSAAptitudeResultsUIProps) {
  const [animatedScores, setAnimatedScores] = useState<number[]>([])

  const getTechnicalScoreLabel = () => {
    if (interviewType === "dsa" || interviewType?.startsWith("dsa-")) return "DSA Skills"
    if (interviewType === "aptitude" || interviewType?.startsWith("aptitude-")) return "Logical Reasoning"
    return "Technical Knowledge"
  }

  const getTechnicalScoreValue = () => {
    if (interviewType === "dsa" || interviewType?.startsWith("dsa-")) return analysis.dsa_score ?? analysis.technical_score ?? 0
    if (interviewType === "aptitude" || interviewType?.startsWith("aptitude-")) return analysis.logical_reasoning_score ?? analysis.technical_score ?? 0
    return analysis.technical_score ?? 0
  }

  const scoreCards = [
    {
      title: "Overall Performance",
      score: analysis.overall_score,
      maxScore: 100,
      color: "from-blue-600 to-blue-400",
      benchmark: "Industry avg: 68%",
    },
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
    ...(analysis.total_questions !== undefined
      ? [
          {
            title: "Total Questions",
            score: analysis.total_questions,
            maxScore: analysis.total_questions,
            color: "from-gray-600 to-gray-400",
            benchmark: "",
          },
        ]
      : []),
    ...(analysis.answered_questions !== undefined
      ? [
          {
            title: "Answered Questions",
            score: analysis.answered_questions,
            maxScore: analysis.total_questions || 0,
            color: "from-blue-600 to-blue-400",
            benchmark: "",
          },
        ]
      : []),
    ...(analysis.correct_answers_count !== undefined && analysis.correct_answers_count !== "0/0"
      ? [
          {
            title: "Correct Answers",
            score: parseInt(analysis.correct_answers_count.split('/')[0]) || 0,
            maxScore: parseInt(analysis.correct_answers_count.split('/')[1]) || 0,
            color: "from-green-600 to-green-400",
            benchmark: "Target: All correct",
          },
        ]
      : []),
    ...(analysis.wrong_answers_count !== undefined && analysis.wrong_answers_count > 0
      ? [
          {
            title: "Wrong Answers",
            score: analysis.wrong_answers_count,
            maxScore: analysis.total_questions || 0,
            color: "from-red-600 to-red-400",
            benchmark: "",
          },
        ]
      : []),
    ...((analysis.total_questions || 0) - (analysis.answered_questions || 0) > 0
      ? [
          {
            title: "Not Answered",
            score: (analysis.total_questions || 0) - (analysis.answered_questions || 0),
            maxScore: analysis.total_questions || 0,
            color: "from-orange-600 to-orange-400",
            benchmark: "",
          },
        ]
      : []),
  ]

  useEffect(() => {
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

  const getPerformanceTier = (score: number) => {
    if (score >= 85) return { label: "Excellent", color: "text-green-600" }
    if (score >= 70) return { label: "Good", color: "text-blue-600" }
    if (score >= 55) return { label: "Fair", color: "text-amber-600" }
    return { label: "Needs Work", color: "text-red-600" }
  }

  return (
    <div className="mb-12 animate-fade-in">
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Your Performance Level</h3>
            <p className={`text-3xl font-bold ${getPerformanceTier(analysis.overall_score).color}`}>
              {getPerformanceTier(analysis.overall_score).label}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {analysis.overall_score >= 85 && "You're interview-ready! Keep practicing to maintain this level."}
              {analysis.overall_score >= 70 && analysis.overall_score < 85 && "You're on the right track. A few more practice sessions will get you ready."}
              {analysis.overall_score >= 55 && analysis.overall_score < 70 && "You're making progress. Focus on the improvement areas below."}
              {analysis.overall_score < 55 && "Keep practicing! Review the detailed feedback to improve quickly."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Compared to others</p>
            <p className="text-2xl font-bold text-blue-600">
              {analysis.overall_score >= 75 ? "Top 25%" : analysis.overall_score >= 60 ? "Top 50%" : "Keep improving!"}
            </p>
          </div>
        </div>
      </div>

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
