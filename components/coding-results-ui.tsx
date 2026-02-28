"use client"

import { useState, useEffect } from "react"

interface AnalysisData {
  overall_score: number
  technical_score: number
  problem_solving_score: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
  correct_answers_count?: string | null
  total_questions?: number
  answered_questions?: number
  wrong_answers_count?: number
  not_answered_questions_count?: number
  evaluations?: Record<string, string>
}

interface ConversationItem {
  questionNumber: number
  question: string
  userAnswer: string
  skipped: boolean
}

interface ProbableAnswer {
  questionNumber: number
  probableAnswer: string
}

interface CodingResultsUIProps {
  analysis: AnalysisData
  interviewType?: string
  conversation?: ConversationItem[]
  probableAnswers?: ProbableAnswer[]
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  if (!code?.trim()) return null
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
      <pre className="rounded-lg border border-gray-200 bg-gray-50 p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap break-words">
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}

export default function CodingResultsUI({
  analysis,
  interviewType = "technical",
  conversation = [],
  probableAnswers = [],
}: CodingResultsUIProps) {
  const [animatedScores, setAnimatedScores] = useState<number[]>([])

  const scoreCards = [
    {
      title: "Code Quality",
      score: analysis.technical_score ?? 0,
      maxScore: 100,
      color: "from-purple-600 to-purple-400",
      benchmark: "Correctness, logic & structure",
    },
    {
      title: "Problem Solving",
      score: analysis.problem_solving_score ?? 0,
      maxScore: 100,
      color: "from-indigo-600 to-indigo-400",
      benchmark: "Approach & efficiency",
    },
    ...(analysis.correct_answers_count != null && analysis.correct_answers_count !== "0/0"
      ? [
          {
            title: "Correct Solutions",
            score: parseInt(String(analysis.correct_answers_count).split("/")[0]) || 0,
            maxScore: parseInt(String(analysis.correct_answers_count).split("/")[1]) || 0,
            color: "from-green-600 to-green-400",
            benchmark: "Target: All correct",
          },
        ]
      : []),
    ...(analysis.wrong_answers_count !== undefined && analysis.wrong_answers_count > 0
      ? [
          {
            title: "Incorrect",
            score: analysis.wrong_answers_count,
            maxScore: analysis.total_questions || 0,
            color: "from-red-600 to-red-400",
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

  // Group by code blocks: Q1=code1, Q2-Q6=concept1; Q7=code2, Q8-Q12=concept2; etc.
  const codeBlocks: Array<{
    problem: string
    userCode: string
    aiCode: string
    conceptQAs: Array<{ question: string; userAnswer: string; probableAnswer?: string }>
  }> = []

  const total = analysis.total_questions || 0
  const codeCount = total === 6 ? 1 : total === 12 ? 2 : total === 18 ? 3 : 1

  for (let i = 0; i < codeCount; i++) {
    const baseQ = i * 6 + 1
    const codeResp = conversation.find((c) => c.questionNumber === baseQ)
    const problem = codeResp?.question || ""
    const userCode = codeResp?.userAnswer || ""
    const aiCodeResp = probableAnswers.find((p) => p.questionNumber === baseQ)
    const aiCode = aiCodeResp?.probableAnswer || ""

    const conceptQAs: Array<{ question: string; userAnswer: string; probableAnswer?: string }> = []
    for (let j = 1; j <= 5; j++) {
      const qNum = baseQ + j
      const qResp = conversation.find((c) => c.questionNumber === qNum)
      const paResp = probableAnswers.find((p) => p.questionNumber === qNum)
      conceptQAs.push({
        question: qResp?.question || "",
        userAnswer: qResp?.userAnswer || "",
        probableAnswer: paResp?.probableAnswer,
      })
    }

    codeBlocks.push({ problem, userCode, aiCode, conceptQAs })
  }

  return (
    <div className="mb-12 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoreCards.map((card, index) => (
          <div
            key={card.title}
            className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
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
                    stroke={`url(#gradient-coding-${index})`}
                    strokeWidth="8"
                    strokeDasharray={`${(animatedScores[index] / (card.maxScore || 1)) * 339.29} 339.29`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id={`gradient-coding-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#2563eb" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900">{animatedScores[index]}</div>
                    <div className="text-sm text-gray-500">/ {card.maxScore}</div>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {card.title}
              </h3>
              <p className="text-xs text-gray-500 text-center">{card.benchmark}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Code blocks: Code N, User code, AI code, 5 concept Q&As */}
      <div className="mt-8 space-y-10">
        {codeBlocks.filter((b) => b.problem || b.userCode).map((block, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Code {idx + 1}</h3>

            {block.problem && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Problem</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{block.problem}</p>
              </div>
            )}

            <CodeBlock code={block.userCode} label="Your Code" />
            <CodeBlock code={block.aiCode} label="Reference Solution (AI)" />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700">Concept Questions (5)</h4>
              {block.conceptQAs.map((qa, qIdx) => (
                <div key={qIdx} className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800">Q{qIdx + 1}: {qa.question}</p>
                  <p className="text-sm text-gray-700 pl-4">
                    <span className="font-medium text-blue-600">Your answer:</span>{" "}
                    {qa.userAnswer || "[No answer]"}
                  </p>
                  {qa.probableAnswer && (
                    <p className="text-sm text-gray-600 pl-4">
                      <span className="font-medium text-green-600">Suggested:</span>{" "}
                      {qa.probableAnswer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {analysis.strengths?.length > 0 && (
        <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Strengths</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {analysis.strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.improvements?.length > 0 && (
        <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Areas to Improve</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {analysis.improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.detailed_feedback && (
        <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Detailed Feedback</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{analysis.detailed_feedback}</p>
        </div>
      )}
    </div>
  )
}
