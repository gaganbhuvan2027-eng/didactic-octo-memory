"use client"

import { useState } from "react"
import { useStreamingInterview } from "@/hooks/use-streaming-interview"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Loader2 } from "lucide-react"

interface StreamingInterviewProps {
  interviewId: string
  onComplete: () => void
}

export function StreamingInterview({ interviewId, onComplete }: StreamingInterviewProps) {
  const {
    isConnected,
    isListening,
    isSpeaking,
    userTranscript,
    aiTranscript,
    currentQuestion,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
  } = useStreamingInterview(interviewId)

  const [hasStarted, setHasStarted] = useState(false)

  const handleStart = async () => {
    await connect()
    setHasStarted(true)
  }

  const handleEnd = () => {
    disconnect()
    onComplete()
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-4xl p-8 space-y-6">
        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-4">
          <div className={`w-4 h-4 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
          <span className="text-sm text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
        </div>

        {/* AI Speaking Indicator */}
        {isSpeaking && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">AI is speaking...</span>
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="flex items-center justify-center gap-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </div>
        )}

        {/* Current Question */}
        {currentQuestion && (
          <div className="p-6 bg-muted rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Current Question:</h3>
            <p className="text-lg">{currentQuestion}</p>
          </div>
        )}

        {/* Live Transcripts */}
        <div className="grid grid-cols-2 gap-4">
          {/* AI Transcript */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex flex-col max-h-[400px]">
            <h4 className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 flex-shrink-0">AI Transcript</h4>
            <div className="overflow-y-auto transcript-scrollbar flex-1">
              <p className="text-sm text-muted-foreground min-h-[100px]">{aiTranscript || "Waiting for AI..."}</p>
            </div>
          </div>

          {/* User Transcript */}
          <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg flex flex-col max-h-[400px]">
            <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex-shrink-0">Your Transcript</h4>
            <div className="overflow-y-auto transcript-scrollbar flex-1">
              <p className="text-sm text-muted-foreground min-h-[100px]">{userTranscript || "Start speaking..."}</p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!hasStarted ? (
            <Button onClick={handleStart} size="lg" className="gap-2">
              <Mic className="w-5 h-5" />
              Start Interview
            </Button>
          ) : (
            <>
              <Button
                onClick={isListening ? stopListening : startListening}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="gap-2"
                disabled={isSpeaking}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Stop Speaking
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    Start Speaking
                  </>
                )}
              </Button>

              <Button onClick={handleEnd} variant="outline" size="lg">
                End Interview
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          <p>The interview will automatically detect when you start and stop speaking.</p>
          <p className="mt-1">Speak naturally - the AI will respond in real-time.</p>
        </div>
      </Card>
    </div>
  )
}
