import DetailedInsights from "./detailed-insights"

interface AnalysisData {
  overall_score: number
  technical_score: number
  logical_reasoning_score?: number
  problem_solving_score: number
  detailed_feedback: string
  strengths: string[]
  improvements: string[]
  correct_answers_count?: string
  total_questions?: number
  answered_questions?: number
  wrong_answers_count?: number
}

interface Props {
  analysis: AnalysisData
  interviewType?: string
}

export default function AptitudeQuantitativeResultsUI({ analysis }: Props) {
  const technicalLabel = "Technical Knowledge"

  return (
    <section className="mb-12 animate-fade-in">
      {/* Top banner */}
      <div className="mb-8 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Aptitude — Quantitative</h3>
            <p className="text-3xl font-bold text-amber-700">Quantitative Aptitude Report</p>
            <p className="text-sm text-gray-600 mt-2">A focused view for quantitative aptitude interviews including AI analysis and detailed insights.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Overall Score</p>
            <p className="text-2xl font-bold text-amber-700">{analysis.overall_score} / 100</p>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-2">Overall Performance</h4>
          <p className="text-4xl font-bold text-amber-600">{analysis.overall_score}</p>
          <p className="text-sm text-gray-500 mt-2">Aggregate performance across all assessed categories.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-2">{technicalLabel}</h4>
          <p className="text-4xl font-bold text-indigo-600">{analysis.technical_score ?? analysis.logical_reasoning_score ?? 0}</p>
          <p className="text-sm text-gray-500 mt-2">Score reflecting your quantitative problem knowledge and method.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-2">Problem Solving</h4>
          <p className="text-4xl font-bold text-indigo-700">{analysis.problem_solving_score}</p>
          <p className="text-sm text-gray-500 mt-2">How effectively you approached and solved the quantitative problems.</p>
        </div>

        {analysis.total_questions !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Total Questions</h4>
            <p className="text-4xl font-bold text-gray-700">{analysis.total_questions}</p>
            <p className="text-sm text-gray-500 mt-2">Total number of questions in the interview.</p>
          </div>
        )}

        {analysis.answered_questions !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Answered Questions</h4>
            <p className="text-4xl font-bold text-blue-700">{analysis.answered_questions}</p>
            <p className="text-sm text-gray-500 mt-2">Number of questions you provided an answer for.</p>
          </div>
        )}

        {analysis.correct_answers_count !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Correct Answers</h4>
            <p className="text-4xl font-bold text-green-700">{analysis.correct_answers_count}</p>
            <p className="text-sm text-gray-500 mt-2">Number of questions answered correctly.</p>
          </div>
        )}

        {analysis.wrong_answers_count !== undefined && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Wrong Answers</h4>
            <p className="text-4xl font-bold text-red-700">{analysis.wrong_answers_count}</p>
            <p className="text-sm text-gray-500 mt-2">Number of questions answered incorrectly.</p>
          </div>
        )}
      </div>

      {/* Comprehensive AI Analysis */}
      <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-3">Comprehensive AI Analysis</h4>
        <p className="text-gray-700 whitespace-pre-wrap">{analysis.detailed_feedback}</p>
      </div>

      {/* Detailed Insights (reuse existing component for consistency) */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold mb-4">Detailed Insights</h4>
        <DetailedInsights analysis={analysis as any} interviewType={"aptitude-quantitative"} />
      </div>
    </section>
  )
}
