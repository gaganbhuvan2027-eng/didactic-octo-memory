"use client"

interface PerformanceMetricsProps {
  overall_score?: number
  communication_score: number
  technical_score: number
  problem_solving_score: number
  confidence_score?: number
  eye_contact_score?: number
  smile_score?: number
  stillness_score?: number
  face_confidence_score?: number
  interviewType?: string
}

export default function PerformanceMetrics({
  communication_score,
  technical_score,
  problem_solving_score,
  interviewType = "technical",
}: PerformanceMetricsProps) {
  const isSkillOnly = (interviewType || '').startsWith('dsa') || (interviewType || '').startsWith('aptitude') || interviewType === 'problem_solving' || interviewType === 'problem-solving'

  const getTechnicalLabel = () => {
    if (interviewType === "dsa") return "DSA Skills"
    if (interviewType === "aptitude") return "Logical Reasoning"
    return "Technical Knowledge"
  }

  const scoreMetrics = [
    { label: getTechnicalLabel(), score: technical_score, icon: "💻" },
    { label: "Problem Solving", score: problem_solving_score, icon: "🧠" },
    ...(!isSkillOnly ? [{ label: "Communication", score: communication_score, icon: "💬" }] : [] ),
  ]


  const ScoreCard = ({ label, score, icon }: { label: string; score: number; icon: string }) => {
    const getColorClass = (score: number) => {
      if (score >= 80) return "text-green-600"
      if (score >= 60) return "text-blue-600"
      if (score >= 40) return "text-amber-600"
      return "text-red-600"
    }

    const getBarColorClass = (score: number) => {
      if (score >= 80) return "bg-green-600"
      if (score >= 60) return "bg-blue-600"
      if (score >= 40) return "bg-amber-600"
      return "bg-red-600"
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${getColorClass(score)}`}>{score}</p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`${getBarColorClass(score)} h-full transition-all duration-1000 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Performance Breakdown</h2>

      {/* Main Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {scoreMetrics.map((metric) => (
          <ScoreCard key={metric.label} {...metric} />
        ))}
      </div>

    </div>
  )
}
