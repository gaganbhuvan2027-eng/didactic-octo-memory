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
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
  const wordCount = words.length
  const lastThreeWords = words.slice(-3).join(" ").toLowerCase()

  const continuationWords = ["um", "uh", "and", "but", "because", "so", "like", "well", "you know", "i mean"]
  const hasActiveFiller = continuationWords.some((word) => lastThreeWords.includes(word))
  const detectedFillers = continuationWords.filter((filler) => text.toLowerCase().includes(filler))

  // Basic rule-based analysis as fallback - more aggressive detection
  const hasPunctuation = /[.!?]$/.test(text)
  const hasNaturalEnding = /(that's|that is|so|and that|thank you|thanks|i think|i believe|i feel)$/i.test(text.trim())
  const basicIsComplete = wordCount >= 3 && (!hasActiveFiller || hasPunctuation) && (hasPunctuation || hasNaturalEnding || wordCount > 8)

  // Call LLM for intelligent turn detection
  try {
    const response = await fetch("/api/interview/turn-detection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: text,
        context: { question },
      }),
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
    console.log("[v0] LLM turn detection failed, using fallback:", error)
  }

  // Fallback to rule-based
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
  audioDeviceId?: string | null
}

export function useVoiceAgent({
  onUserSpeechStart,
  onUserSpeechEnd,
  onTranscriptUpdate,
  onInterrupt,
  enableBargeIn = true,
  audioThreshold = 65, // Increased to reduce sensitivity to small sounds
  currentQuestion = "",
  audioDeviceId,
}: VoiceAgentOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeechDetected, setIsSpeechDetected] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState("")
  const [currentAnalysis, setCurrentAnalysis] = useState<SpeechAnalysis | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const transcriptRef = useRef("")
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasStartedSpeakingRef = useRef(false)
  const isAISpeakingRef = useRef(false)
  const isListeningRef = useRef(false)
  const shouldRestartRef = useRef(false)
  const lastLLMCheckRef = useRef<number>(0)
  const llmCheckThrottleMs = 800 // Reduced for faster, more natural turn detection

  const onUserSpeechStartRef = useRef(onUserSpeechStart)
  const onUserSpeechEndRef = useRef(onUserSpeechEnd)
  const onTranscriptUpdateRef = useRef(onTranscriptUpdate)
  const onInterruptRef = useRef(onInterrupt)

  useEffect(() => {
    onUserSpeechStartRef.current = onUserSpeechStart
    onUserSpeechEndRef.current = onUserSpeechEnd
    onTranscriptUpdateRef.current = onTranscriptUpdate
    onInterruptRef.current = onInterrupt
  }, [onUserSpeechStart, onUserSpeechEnd, onTranscriptUpdate, onInterrupt])

  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.log("[v0] Speech Recognition not supported in this browser - disabling voice features")
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
    }

    recognition.onresult = async (event: any) => {
      // Ignore results if AI is speaking to prevent carryover
      if (isAISpeakingRef.current) {
        console.log("[v0] Ignoring speech recognition result - AI is speaking")
        return
      }

      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + " "
        } else {
          interim += transcript
        }
      }

      if (final) {
        transcriptRef.current += final
      }

      const currentText = (transcriptRef.current + interim).trim()

      if (currentText) {
        setLiveTranscript(currentText)

        const now = Date.now()
        const shouldCheckLLM =
          now - lastLLMCheckRef.current > llmCheckThrottleMs && currentText.split(/\s+/).length >= 5

        if (shouldCheckLLM) {
          lastLLMCheckRef.current = now
          const analysis = await analyzeTranscriptWithLLM(currentText, currentQuestion)
          setCurrentAnalysis(analysis)
          onTranscriptUpdateRef.current?.(currentText, analysis)

          console.log("[v0] LLM Analysis:", {
            text: currentText.substring(0, 40),
            isComplete: analysis.llmIsComplete,
            confidence: analysis.llmConfidence?.toFixed(2),
          })

          if (analysis.llmIsComplete && analysis.llmConfidence && analysis.llmConfidence > 0.78) {
            console.log("[v0] LLM detected completion with high confidence, ending turn")
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
            }

            const finalText = transcriptRef.current.trim()
            if (finalText && hasStartedSpeakingRef.current) {
              onUserSpeechEndRef.current(finalText, analysis)
              transcriptRef.current = ""
              setLiveTranscript("")
              setCurrentAnalysis(null)
              hasStartedSpeakingRef.current = false
              return
            }
          }
        }

        if (!hasStartedSpeakingRef.current && currentText.length > 0) {
          hasStartedSpeakingRef.current = true
          onUserSpeechStartRef.current()
          console.log("[v0] User started speaking")
        }

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }

        silenceTimerRef.current = setTimeout(async () => {
          const finalText = transcriptRef.current.trim()
          if (finalText && hasStartedSpeakingRef.current && finalText.split(/\s+/).length >= 3) {
            console.log("[v0] Silence detected, performing final LLM check...")
            const finalAnalysis = await analyzeTranscriptWithLLM(finalText, currentQuestion)
            console.log(
              "[v0] Final LLM decision:",
              finalAnalysis.llmIsComplete,
              "confidence:",
              finalAnalysis.llmConfidence,
            )

            onUserSpeechEndRef.current(finalText, finalAnalysis)
            transcriptRef.current = ""
            setLiveTranscript("")
            setCurrentAnalysis(null)
            hasStartedSpeakingRef.current = false
          }
        }, 2500) // Balanced at 2.5 seconds - allows natural pauses without waiting too long
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        return
      }

      console.error("[v0] Speech recognition error:", event.error)

      if (event.error === "not-allowed" || event.error === "permission-denied") {
        alert("Microphone permission denied. Please allow microphone access to continue.")
        setIsListening(false)
        isListeningRef.current = false
      }
    }

    recognition.onend = () => {
      if (shouldRestartRef.current && isListeningRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current) {
            try {
              recognitionRef.current.start()
            } catch (e) {
              console.log("[v0] Could not restart, already running")
            }
          }
        }, 100)
      }
    }

    recognitionRef.current = recognition
    console.log("[v0] Voice agent initialized with LLM turn detection")

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [currentQuestion]) // Added currentQuestion dependency

  const startVAD = useCallback(async () => {
    if (!isSupported) {
      console.log("[v0] Voice features not available in this environment")
      return
    }

    try {
      console.log("[v0] Requesting microphone access...")
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      }
      if (audioDeviceId) {
        audioConstraints.deviceId = { exact: audioDeviceId }
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
      streamRef.current = stream

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      // Add gain node for volume control
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 1.0

      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      
      // Connect with gain node
      microphone.connect(gainNode)
      gainNode.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkAudio = () => {
        if (!analyserRef.current) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(average)

        const wasSpeaking = isSpeechDetected
        const isSpeaking = average > audioThreshold

        if (isSpeaking !== wasSpeaking) {
          setIsSpeechDetected(isSpeaking)

          if (isSpeaking && isAISpeakingRef.current && enableBargeIn) {
            console.log("[v0] Barge-in detected!")
            onInterruptRef.current()
          }
        }

        animationFrameRef.current = requestAnimationFrame(checkAudio)
      }

      checkAudio()
      console.log("[v0] VAD started with threshold:", audioThreshold)
    } catch (error) {
      console.error("[v0] Microphone access error:", error)
      alert("Please allow microphone access to use voice features")
    }
  }, [audioThreshold, enableBargeIn, isSpeechDetected, isSupported, audioDeviceId])

  const stopVAD = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setAudioLevel(0)
    setIsSpeechDetected(false)
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported) {
      console.log("[v0] Voice recognition not supported - cannot start listening")
      return
    }

    console.log("[v0] Starting voice agent listening mode...")
    setIsListening(true)
    isListeningRef.current = true
    shouldRestartRef.current = true
    transcriptRef.current = ""
    hasStartedSpeakingRef.current = false
    setLiveTranscript("")
    setCurrentAnalysis(null)

    await startVAD()

    setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.start()
          console.log("[v0] Speech recognition started")
        } catch (error: any) {
          if (error.message.includes("already started")) {
            console.log("[v0] Recognition already running")
          } else {
            console.error("[v0] Error starting recognition:", error)
          }
        }
      }
    }, 300)
  }, [startVAD, isSupported])

  const stopListening = useCallback(() => {
    console.log("[v0] Stopping voice agent...")
    setIsListening(false)
    isListeningRef.current = false
    shouldRestartRef.current = false
    hasStartedSpeakingRef.current = false

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }

    stopVAD()

    transcriptRef.current = ""
    setLiveTranscript("")
    setCurrentAnalysis(null)
  }, [stopVAD])

  const setAISpeaking = useCallback((speaking: boolean) => {
    const wasAISpeaking = isAISpeakingRef.current
    isAISpeakingRef.current = speaking
    
    // When AI starts speaking, clear any lingering transcript to prevent carryover
    if (speaking && !wasAISpeaking) {
      console.log("[v0] AI started speaking - clearing transcript and stopping recognition to prevent carryover")
      
      // Stop and restart recognition to clear any buffered results
      if (recognitionRef.current && isListeningRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          console.log("[v0] Recognition already stopped")
        }
      }
      
      transcriptRef.current = ""
      setLiveTranscript("")
      setCurrentAnalysis(null)
      hasStartedSpeakingRef.current = false
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      
      // Restart recognition after a short delay to ensure clean slate
      if (isListeningRef.current) {
        setTimeout(() => {
          if (recognitionRef.current && isListeningRef.current && !isAISpeakingRef.current) {
            try {
              recognitionRef.current.start()
              console.log("[v0] Recognition restarted after AI speech")
            } catch (e) {
              console.log("[v0] Could not restart recognition:", e)
            }
          }
        }, 100)
      }
    }
  }, [])

  const manualSubmit = useCallback(async () => {
    console.log("[v0] Manual submit triggered")
    
    // Clear any pending silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    const finalText = transcriptRef.current.trim()
    if (finalText && hasStartedSpeakingRef.current && finalText.split(/\s+/).length >= 3) {
      console.log("[v0] Manual submit - performing final LLM check...")
      const finalAnalysis = await analyzeTranscriptWithLLM(finalText, currentQuestion)
      
      onUserSpeechEndRef.current(finalText, finalAnalysis)
      transcriptRef.current = ""
      setLiveTranscript("")
      setCurrentAnalysis(null)
      hasStartedSpeakingRef.current = false
    }
  }, [currentQuestion])

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
  }
}
