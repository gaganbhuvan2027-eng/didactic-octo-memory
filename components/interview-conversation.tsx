"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, Loader2, Play, Download } from "lucide-react"
import { getQuestionVideo } from "@/lib/interview-video-store"

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

interface InterviewConversationProps {
  conversation: ConversationItem[]
  probableAnswers: ProbableAnswer[]
  interviewId?: string | null
  interviewType?: string | null
  totalQuestions?: number
  answeredQuestions?: number
}

export default function InterviewConversation({
  conversation,
  probableAnswers,
  interviewId,
  interviewType,
}: InterviewConversationProps) {
  const isDsaOrAptitude = interviewType?.startsWith("dsa-") || interviewType?.startsWith("aptitude")
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({})
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentItem = conversation.find((c) => c.questionNumber === (selectedQuestion ?? conversation[0]?.questionNumber))
  const effectiveSelected = selectedQuestion ?? conversation[0]?.questionNumber ?? 1

  const videoUrlRef = useRef<string | null>(null)
  const videoBlobRef = useRef<Blob | null>(null)

  const handleDownloadVideo = async () => {
    if (!currentItem || !videoUrls[currentItem.questionNumber]) return
    try {
      let blob = videoBlobRef.current
      if (!blob) {
        const res = await fetch(videoUrls[currentItem.questionNumber])
        blob = await res.blob()
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `interview-q${currentItem.questionNumber}-response.webm`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to download video:", err)
    }
  }

  useEffect(() => {
    if (!interviewId || !currentItem || isDsaOrAptitude) return
    let cancelled = false
    getQuestionVideo(interviewId, currentItem.questionNumber).then((blob) => {
      if (cancelled || !blob) return
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
      videoBlobRef.current = blob
      const url = URL.createObjectURL(blob)
      videoUrlRef.current = url
      setVideoUrls({ [currentItem.questionNumber]: url })
    })
    return () => {
      cancelled = true
      videoBlobRef.current = null
    }
  }, [interviewId, currentItem?.questionNumber, isDsaOrAptitude])

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
    }
  }, [])

  const getProbableAnswer = (questionNumber: number): string => {
    const pa = probableAnswers.find((p) => p.questionNumber === questionNumber)
    const ans = pa?.probableAnswer
    if (typeof ans === "string") return ans
    if (ans && typeof ans === "object" && ("term" in ans || "meaning" in ans)) {
      const o = ans as { term?: string; meaning?: string }
      return [o.term, o.meaning].filter(Boolean).join(": ") || ""
    }
    return ans != null ? String(ans) : ""
  }

  if (conversation.length === 0) {
    return (
      <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Interview Conversation & Probable Answers</h2>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>Loading interview conversation...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-12 animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Question-by-Question Review</h2>
          </div>
          <p className="text-gray-600">
            {isDsaOrAptitude
              ? "Review your answers and compare with suggested responses."
              : "Review your answers, compare with suggested responses, and watch your recorded response for each question."}
          </p>
        </div>

        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Sidebar - Question list */}
          <div className="md:w-48 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 p-3 flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
            {conversation.map((item) => (
              <button
                key={item.questionNumber}
                onClick={() => setSelectedQuestion(item.questionNumber)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  effectiveSelected === item.questionNumber
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                }`}
              >
                Q{item.questionNumber}
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 space-y-6">
            {currentItem && (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-blue-600 mb-1">Question {currentItem.questionNumber}</h3>
                  <p className="text-gray-900 font-medium text-lg">{currentItem.question}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Your Answer:</h4>
                  {currentItem.skipped ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold">Skipped</span>
                  ) : (
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
                      {typeof currentItem.userAnswer === "string"
                        ? currentItem.userAnswer
                        : (() => {
                            const u = currentItem.userAnswer as unknown
                            if (u && typeof u === "object" && ("term" in u || "meaning" in u)) {
                              const o = u as { term?: string; meaning?: string }
                              return [o.term, o.meaning].filter(Boolean).join(": ")
                            }
                            return String(u ?? "")
                          })()}
                    </p>
                  )}
                </div>

                {getProbableAnswer(currentItem.questionNumber) ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-green-700">Suggested Answer:</h4>
                    <p className="text-gray-700 bg-green-50 rounded-lg p-4 leading-relaxed whitespace-pre-wrap">
                      {getProbableAnswer(currentItem.questionNumber)}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating suggested answer...</span>
                  </div>
                )}

                {/* Video player - hidden for DSA/aptitude (no video recorded) */}
                {!isDsaOrAptitude && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Your Response
                      </h4>
                      {videoUrls[currentItem.questionNumber] && (
                        <button
                          onClick={handleDownloadVideo}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Video
                        </button>
                      )}
                    </div>
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      {videoUrls[currentItem.questionNumber] ? (
                        <video
                          ref={videoRef}
                          src={videoUrls[currentItem.questionNumber]}
                          controls
                          className="w-full h-full object-contain"
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                          {interviewId ? "No recording for this question" : "Video not available"}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
