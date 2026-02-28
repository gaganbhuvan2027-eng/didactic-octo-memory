"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface SpeechAnalysis {
  originalText: string
  cleanedText: string
  wordCount: number
  hasActiveFiller: boolean
  isComplete: boolean
  confidence: number
  lastWords: string
  fillerWords: string[]
  llmIsComplete?: boolean
  llmConfidence?: number
  llmReasoning?: string
}

const analyzeTranscriptWithLLM = async (text: string, question: string): Promise<SpeechAnalysis> => {
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0)
  const wordCount = words.length
  const lastThreeWords = words.slice(-3).join(" ").toLowerCase()

  const continuationWords = ["um", "uh", "and", "but", "because", "so", "like", "well", "you know", "i mean"]
  const hasActiveFiller = continuationWords.some((word) => lastThreeWords.includes(word))
  const detectedFillers = continuationWords.filter((filler) => text.toLowerCase().includes(filler))

  const hasPunctuation = /[.!?]$/.test(text)
  const hasNaturalEnding = /(that's all|that is all|thank you|thanks|i'm done|that's it|the end)$/i.test(text.trim())
  const basicIsComplete = wordCount >= 5 && hasNaturalEnding

  try {
    const response = await fetch("/api/interview/turn-detection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript: text, context: { question } }),
    })

    if (response.ok) {
      const llmAnalysis = await response.json()
      return {
        originalText: text,
        cleanedText: text,
        wordCount,
        hasActiveFiller,
        isComplete: llmAnalysis.isComplete,
        confidence: llmAnalysis.confidence,
        lastWords: lastThreeWords,
        fillerWords: detectedFillers,
        llmIsComplete: llmAnalysis.isComplete,
        llmConfidence: llmAnalysis.confidence,
        llmReasoning: llmAnalysis.reasoning,
      }
    }
  } catch (error) {
    console.log("[Groq Voice Agent] LLM turn detection failed, using fallback")
  }

  return {
    originalText: text,
    cleanedText: text,
    wordCount,
    hasActiveFiller,
    isComplete: basicIsComplete,
    confidence: basicIsComplete ? 0.7 : 0.3,
    lastWords: lastThreeWords,
    fillerWords: detectedFillers,
  }
}

interface VoiceAgentOptions {
  onUserSpeechStart: () => void
  onUserSpeechEnd: (transcript: string, analysis: SpeechAnalysis) => void
  onTranscriptUpdate?: (transcript: string, analysis: SpeechAnalysis) => void
  onInterrupt: () => void
  enableBargeIn?: boolean
  audioThreshold?: number
  currentQuestion?: string
}

export function useVoiceAgentGroq({
  onUserSpeechStart,
  onUserSpeechEnd,
  onTranscriptUpdate,
  onInterrupt,
  enableBargeIn = true,
  audioThreshold = 35,
  currentQuestion = "",
}: VoiceAgentOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeechDetected, setIsSpeechDetected] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [currentAnalysis, setCurrentAnalysis] = useState<SpeechAnalysis | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [isTranscribing, setIsTranscribing] = useState(false)

  // All refs to avoid stale closures
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Accumulated transcript from multiple recordings
  const accumulatedTranscriptRef = useRef("")
  
  // Use refs for state that needs to be accessed in callbacks
  const isSpeakingRef = useRef(false)
  const isRecordingRef = useRef(false)
  const isAISpeakingRef = useRef(false)
  const hasCalledSpeechStartRef = useRef(false)
  const currentQuestionRef = useRef(currentQuestion)
  const isProcessingRef = useRef(false)

  // Callback refs to avoid stale closures
  const onUserSpeechStartRef = useRef(onUserSpeechStart)
  const onUserSpeechEndRef = useRef(onUserSpeechEnd)
  const onInterruptRef = useRef(onInterrupt)

  useEffect(() => {
    onUserSpeechStartRef.current = onUserSpeechStart
    onUserSpeechEndRef.current = onUserSpeechEnd
    onInterruptRef.current = onInterrupt
    currentQuestionRef.current = currentQuestion
  }, [onUserSpeechStart, onUserSpeechEnd, onInterrupt, currentQuestion])

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      const hasMediaRecorder = typeof MediaRecorder !== "undefined"
      setIsSupported(hasMediaDevices && hasMediaRecorder)
    }
  }, [])

  // Transcribe audio using Groq Whisper
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    if (audioBlob.size < 1000) {
      console.log("[Groq Voice Agent] Audio too small:", audioBlob.size, "bytes")
      return null
    }

    console.log("[Groq Voice Agent] 📤 Transcribing...", audioBlob.size, "bytes")
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      formData.append("file", audioBlob, "audio.webm")

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[Groq Voice Agent] ✅ Got:", data.text)
        return data.text || null
      } else {
        console.error("[Groq Voice Agent] ❌ Transcription failed:", response.status)
        return null
      }
    } catch (error) {
      console.error("[Groq Voice Agent] ❌ Network error:", error)
      return null
    } finally {
      setIsTranscribing(false)
    }
  }, [])

  // Submit the accumulated transcript
  const submitTranscript = useCallback(async () => {
    if (isProcessingRef.current) {
      console.log("[Groq Voice Agent] Already processing, skipping")
      return
    }

    // Clear auto-submit timer
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current)
      autoSubmitTimerRef.current = null
    }

    const transcript = accumulatedTranscriptRef.current.trim()
    if (!transcript) {
      console.log("[Groq Voice Agent] No transcript to submit")
      return
    }

    isProcessingRef.current = true
    console.log("[Groq Voice Agent] 📨 Submitting:", transcript)

    const analysis = await analyzeTranscriptWithLLM(transcript, currentQuestionRef.current)
    
    if (hasCalledSpeechStartRef.current) {
      onUserSpeechEndRef.current(transcript, analysis)
    }

    // Clear state
    accumulatedTranscriptRef.current = ""
    setLiveTranscript("")
    setCurrentAnalysis(null)
    hasCalledSpeechStartRef.current = false
    isProcessingRef.current = false
  }, [])

  // Process recorded audio - accumulates transcripts
  const processAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) {
      console.log("[Groq Voice Agent] No audio chunks")
      return
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
    audioChunksRef.current = []

    const transcribedText = await transcribeAudio(audioBlob)

    if (transcribedText && transcribedText.trim()) {
      // Accumulate transcript
      if (accumulatedTranscriptRef.current) {
        accumulatedTranscriptRef.current += " " + transcribedText.trim()
      } else {
        accumulatedTranscriptRef.current = transcribedText.trim()
      }
      
      console.log("[Groq Voice Agent] 📝 Accumulated:", accumulatedTranscriptRef.current)
      setLiveTranscript(accumulatedTranscriptRef.current)

      // Start/reset auto-submit timer (4 seconds of no new speech)
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current)
      }
      autoSubmitTimerRef.current = setTimeout(() => {
        console.log("[Groq Voice Agent] ⏰ Auto-submitting after 2s silence")
        submitTranscript()
      }, 2000) // Reduced from 4s to 2s for faster response
    }
  }, [transcribeAudio, submitTranscript])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    if (!isRecordingRef.current) return

    console.log("[Groq Voice Agent] ⏹️ Stopping recording...")
    isRecordingRef.current = false

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.error("[Groq Voice Agent] Error stopping:", e)
      }
    }
  }, [])

  // Start recording
  const startRecording = useCallback(() => {
    if (!streamRef.current || isRecordingRef.current || isAISpeakingRef.current) {
      return
    }

    console.log("[Groq Voice Agent] 🎙️ Recording...")
    audioChunksRef.current = []
    isRecordingRef.current = true

    try {
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") 
        ? "audio/webm;codecs=opus" 
        : "audio/webm"
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && !isAISpeakingRef.current) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        console.log("[Groq Voice Agent] Recording stopped, processing...")
        processAudio()
      }

      mediaRecorderRef.current.start(500) // Increased from 100ms to 500ms for better chunks

      // Safety timeout - max 5 seconds per recording segment for faster feedback
      recordingTimerRef.current = setTimeout(() => {
        console.log("[Groq Voice Agent] ⏱️ Segment timeout")
        stopRecording()
      }, 5000) // Reduced from 60s to 5s for near-instant transcription

    } catch (error) {
      console.error("[Groq Voice Agent] Recording error:", error)
      isRecordingRef.current = false
    }
  }, [processAudio, stopRecording])

  // Voice Activity Detection loop
  const startVAD = useCallback(async () => {
    try {
      console.log("[Groq Voice Agent] 🎤 Starting microphone...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        } 
      })
      streamRef.current = stream
      console.log("[Groq Voice Agent] ✅ Mic ready")

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      // Add gain node for additional volume control if needed
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 1.0 // Default gain, can be adjusted based on calibration

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5
      
      // Connect: microphone -> gain -> analyser
      microphone.connect(gainNode)
      gainNode.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkAudio = () => {
        if (!analyserRef.current || !streamRef.current) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(average)

        const wasSpeaking = isSpeakingRef.current
        const nowSpeaking = average > audioThreshold

        // Speech started
        if (nowSpeaking && !wasSpeaking && !isAISpeakingRef.current) {
          console.log("[Groq Voice Agent] 🗣️ Speaking... Level:", average.toFixed(0))
          isSpeakingRef.current = true
          setIsSpeechDetected(true)

          // Cancel silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }

          // Cancel auto-submit timer (user is still talking)
          if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current)
            autoSubmitTimerRef.current = null
          }

          // Notify parent
          if (!hasCalledSpeechStartRef.current) {
            hasCalledSpeechStartRef.current = true
            onUserSpeechStartRef.current()
          }

          // Start recording if not already
          if (!isRecordingRef.current) {
            startRecording()
          }
        }

        // Speech paused - wait 3 seconds before stopping this recording segment
        if (!nowSpeaking && wasSpeaking) {
          console.log("[Groq Voice Agent] 🤫 Pause detected...")
          isSpeakingRef.current = false
          setIsSpeechDetected(false)

          // Start silence timer (3 seconds to stop this segment)
          if (!silenceTimerRef.current && isRecordingRef.current) {
            silenceTimerRef.current = setTimeout(() => {
              console.log("[Groq Voice Agent] Segment complete")
              silenceTimerRef.current = null
              stopRecording()
              // After recording stops, processAudio will be called
              // Then auto-submit timer starts (4 more seconds)
            }, 3000) // 3 seconds before stopping segment
          }
        }

        // Speech resumed - cancel timers
        if (nowSpeaking && silenceTimerRef.current) {
          console.log("[Groq Voice Agent] 🎤 Continuing...")
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }

        // Barge-in
        if (nowSpeaking && isAISpeakingRef.current && enableBargeIn) {
          console.log("[Groq Voice Agent] ⚡ Interrupting AI")
          onInterruptRef.current()
        }

        animationFrameRef.current = requestAnimationFrame(checkAudio)
      }

      checkAudio()
      console.log("[Groq Voice Agent] ✅ Listening (threshold:", audioThreshold + ")")
    } catch (error) {
      console.error("[Groq Voice Agent] ❌ Mic error:", error)
      setIsSupported(false)
    }
  }, [audioThreshold, enableBargeIn, startRecording, stopRecording])

  // Stop VAD
  const stopVAD = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current)
      autoSubmitTimerRef.current = null
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.stop() } catch (e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try { audioContextRef.current.close() } catch (e) {}
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    analyserRef.current = null
    isSpeakingRef.current = false
    isRecordingRef.current = false
    setAudioLevel(0)
    setIsSpeechDetected(false)
  }, [])

  // Public: Start listening
  const startListening = useCallback(async () => {
    if (!isSupported) return

    console.log("[Groq Voice Agent] 🚀 Starting...")
    
    // Reset ALL state
    audioChunksRef.current = []
    accumulatedTranscriptRef.current = ""
    hasCalledSpeechStartRef.current = false
    isSpeakingRef.current = false
    isRecordingRef.current = false
    isProcessingRef.current = false
    setLiveTranscript("")
    setCurrentAnalysis(null)
    setIsListening(true)

    await startVAD()
  }, [startVAD, isSupported])

  // Public: Stop listening - COMPLETELY stops all activity
  const stopListening = useCallback(() => {
    console.log("[Groq Voice Agent] 🛑 STOPPING ALL ACTIVITY")
    setIsListening(false)
    
    // Stop VAD loop
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try { mediaRecorderRef.current.stop() } catch (e) {}
    }
    
    // Clear ALL timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current)
      autoSubmitTimerRef.current = null
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    
    // Close audio context and stream
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try { audioContextRef.current.close() } catch (e) {}
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    analyserRef.current = null
    
    // Clear ALL state
    audioChunksRef.current = []
    accumulatedTranscriptRef.current = ""
    hasCalledSpeechStartRef.current = false
    isSpeakingRef.current = false
    isRecordingRef.current = false
    isProcessingRef.current = false
    setLiveTranscript("")
    setCurrentAnalysis(null)
    setAudioLevel(0)
    setIsSpeechDetected(false)
  }, [])

  // Public: Set AI speaking - COMPLETELY stops all voice activity when AI speaks
  const setAISpeaking = useCallback((speaking: boolean) => {
    const was = isAISpeakingRef.current
    isAISpeakingRef.current = speaking

    if (speaking && !was) {
      console.log("[Groq Voice Agent] 🤖 AI SPEAKING - STOPPING ALL VOICE ACTIVITY")
      
      // Stop VAD completely
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        try { mediaRecorderRef.current.stop() } catch (e) {}
      }
      
      // Clear ALL timers
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      if (autoSubmitTimerRef.current) {
        clearTimeout(autoSubmitTimerRef.current)
        autoSubmitTimerRef.current = null
      }
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      
      // Clear ALL state
      audioChunksRef.current = []
      accumulatedTranscriptRef.current = ""
      hasCalledSpeechStartRef.current = false
      isSpeakingRef.current = false
      isRecordingRef.current = false
      isProcessingRef.current = false
      setLiveTranscript("")
      setCurrentAnalysis(null)
      setAudioLevel(0)
      setIsSpeechDetected(false)
    }

    if (!speaking && was) {
      console.log("[Groq Voice Agent] 🤖 AI done - resetting for user input")
      // Reset all state for fresh start
      audioChunksRef.current = []
      accumulatedTranscriptRef.current = ""
      hasCalledSpeechStartRef.current = false
      isSpeakingRef.current = false
      isRecordingRef.current = false
      isProcessingRef.current = false
      setLiveTranscript("")
      setCurrentAnalysis(null)
    }
  }, [])

  // Public: Manual submit - immediately submits whatever has been recorded
  const manualSubmit = useCallback(() => {
    console.log("[Groq Voice Agent] 👆 Manual submit")
    
    // Stop recording first (this will trigger processAudio)
    stopRecording()
    
    // Wait a bit for processAudio to complete, then submit
    setTimeout(() => {
      submitTranscript()
    }, 500)
  }, [stopRecording, submitTranscript])

  // Cleanup
  useEffect(() => {
    return () => {
      stopVAD()
    }
  }, [stopVAD])

  return {
    startListening,
    stopListening,
    isListening,
    isSpeechDetected,
    audioLevel,
    liveTranscript,
    currentAnalysis,
    setAISpeaking,
    isSupported,
    manualSubmit,
    isTranscribing,
  }
}
