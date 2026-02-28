"use client"

import { useState } from "react"

export default function InterviewTranscript() {
  const [transcript] = useState([
    { speaker: "AI", text: "Hello! Welcome to your interview. Let's start with a warm-up question." },
    { speaker: "You", text: "Thank you! I'm ready to begin." },
    { speaker: "AI", text: "Can you tell me about your most recent project?" },
  ])

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col h-64">
      <h3 className="font-bold text-gray-900 mb-3">Your Transcript</h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {transcript.map((item, idx) => (
          <div key={idx} className="text-sm">
            <p className="font-medium text-gray-900">{item.speaker}</p>
            <p className="text-gray-600 text-xs mt-1">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
