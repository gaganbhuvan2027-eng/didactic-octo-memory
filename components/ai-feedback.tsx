"use client"

interface AnalysisData {
  overall_score: number
  communication_score: number
  technical_score: number
  dsa_score?: number
  logical_reasoning_score?: number
  problem_solving_score: number
  confidence_score: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
  interviewType?: string
}

interface AIFeedbackProps {
  analysis: AnalysisData
}

export default function AIFeedback({ analysis }: AIFeedbackProps) {
  return (
    <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
      {/* Glass-like card with feedback */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm">
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Comprehensive AI Analysis</h2>

        <div className="prose max-w-none">
          <div className="text-gray-700 leading-relaxed text-base space-y-4">
            {analysis.detailed_feedback && analysis.detailed_feedback.trim() ? (
              analysis.detailed_feedback.split('\n').map((paragraph, idx) => (
                paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
              ))
            ) : (
              <p className="text-gray-500 italic">
                No detailed analysis was generated for this interview. This can happen if there were no meaningful responses, or the analysis is still processing. Try refreshing the page, or ensure you provide substantive answers in your next interview.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
