"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import FaceAnalysis, { type FaceAnalysisRef } from "./face-analysis"
import AudioVisualizer from "./audio-visualizer"
import AudioReactiveOrb from "./audio-reactive-orb"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { useVoiceAgent } from "@/hooks/use-voice-agent"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"
import { getInterviewCost } from "@/utils/credits"
import "@/app/interview/interview-mobile-landscape.css"
import { 
  calibrateMicrophone, 
  saveCalibration, 
  loadCalibration,
  sensitivityToThreshold,
  thresholdToSensitivity,
  type CalibrationResult 
} from "@/lib/audio/mic-calibration"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { InterviewTimer } from "@/components/interview-timer"
import { ExitInterviewDialog } from "./exit-interview-dialog"
import { EvaluationCriteriaDialog } from "./evaluation-criteria-dialog"
import { MediaDeviceSelectionDialog } from "./media-device-selection-dialog"
import { StartInterviewDialog } from "./start-interview-dialog"
import { Info, Settings } from "lucide-react"
import { useInterviewContext } from "@/contexts/interview-context"
import { isChromeOrEdge, BROWSER_REQUIRED_MESSAGE } from "@/lib/browser-compat"

interface AudioVideoInterviewerProps {
  interviewType: string
  customScenario?: {
    description: string
    goals: string[]
    focusAreas: string[]
    context: string
  }
  scheduledInterviewId?: string | null
}

interface TranscriptMessage {
  type: "ai" | "user"
  content: string
  timestamp: Date
  questionNumber?: number
}

export default function AudioVideoInterviewer({
  interviewType,
  customScenario,
  scheduledInterviewId,
}: AudioVideoInterviewerProps) {
  const router = useRouter()
  const [scheduledInterviewIdState, setScheduledInterviewIdState] = useState<string | null>(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isInterviewComplete, setIsInterviewComplete] = useState(false)
  const [showEndConfirmDialog, setShowEndConfirmDialog] = useState(false)
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false)
  const [showEvaluationCriteria, setShowEvaluationCriteria] = useState(false)
  const [showMediaSettings, setShowMediaSettings] = useState(false)
  const [videoDeviceId, setVideoDeviceId] = useState<string | null>(null)
  const [audioDeviceId, setAudioDeviceId] = useState<string | null>(null)
  
  // Interview context for navbar communication
  let interviewContext: ReturnType<typeof useInterviewContext> | null = null
  try {
    interviewContext = useInterviewContext()
  } catch {
    // Context not available (component used outside provider)
  }

  useEffect(() => {
    // Only access search params on client side after mount
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)

      // If an interviewId is provided in the URL, check whether analysis already exists -- if so redirect to results
      const urlInterviewId = params.get("interviewId")
      if (urlInterviewId) {
        ;(async () => {
          try {
            const res = await fetch(`/api/interview/results?interviewId=${urlInterviewId}`)
            if (res.ok) {
              // analysis exists, redirect to results
              router.push(`/results?interviewId=${urlInterviewId}`)
              return
            } else {
              // no analysis yet - let the UI continue with the provided interview id
              setInterviewId(urlInterviewId)
            }
          } catch (err) {
            console.warn('[v0] Error checking interview results for interviewId:', urlInterviewId, err)
          }
        })()
      }

      // support both `scheduledInterviewId` and `scheduleId` (existing code uses `scheduleId` when routing)
      const schedId = params.get("scheduledInterviewId") || params.get("scheduleId")
      if (schedId) {
        setScheduledInterviewIdState(schedId)

        // If a schedule exists, check if there's an associated interview or if schedule is completed
        ;(async () => {
          try {
            const res = await fetch(`/api/user/schedule-result?scheduleId=${schedId}`)
            if (res.ok) {
              const data = await res.json()
              // If schedule/interview already completed, take user to results
              if (data.scheduleStatus === 'completed' || data.interviewStatus === 'completed') {
                if (data.interviewId) {
                  router.push(`/results?interviewId=${data.interviewId}`)
                  return
                }
              }

              // If an in-progress interview exists for this schedule, continue that interview
              if (data.interviewId) {
                setInterviewId(data.interviewId)
              }
            }
          } catch (err) {
            console.warn('[v0] Error checking schedule-result for scheduleId:', schedId, err)
          }
        })()
      }

      const difficultyParam = params.get("difficulty")
      if (difficultyParam) {
        setSelectedDifficulty(difficultyParam)
      }

      const durationParam = params.get("duration")
      if (durationParam) {
        const parsed = parseInt(durationParam, 10)
        if (!isNaN(parsed)) setSelectedDuration(parsed)
      }
    }
  }, [])

  // Function to complete interview (extracted for reuse)
  const stopAllSpeech = () => {
    try {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    } catch (err) {
      console.warn("[v0] Unable to cancel speech synthesis:", err)
    }
  }

  const completeInterview = async () => {
    stopAllSpeech()
    voiceAgent.stopListening()
    if (faceAnalysisRef.current) {
      faceAnalysisRef.current.stopCamera()
    }
    await handleInterviewCompletion(responses) // Use the current state of responses
    setShowResults(true)
  }

  const handleTimeUp = () => {
    if (!showResults) {
      completeInterview()
    }
  }

  useEffect(() => {
    const currentScheduledId = scheduledInterviewId || scheduledInterviewIdState
    if (!currentScheduledId) return
    if (!isChromeOrEdge()) return // Block unsupported browsers - show welcome with warning

    console.log("[v0] Starting scheduled interview with ID:", currentScheduledId)

    // Bypass setup dialog and start directly
    setShowWelcome(false)
    setHasStarted(true)

    // Start the interview automatically
    startInterviewWithSettings(selectedDuration!, selectedDifficulty!)
  }, [scheduledInterviewId, scheduledInterviewIdState])

  const [isListening, setIsListening] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [userResponse, setUserResponse] = useState("")
  const [showWelcome, setShowWelcome] = useState(true)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [responses, setResponses] = useState<Array<{ question: string; answer: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [showSkipConfirm, setShowSkipConfirm] = useState(false)
  const [isProcessingResponse, setIsProcessingResponse] = useState(false)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [conversationState, setConversationState] = useState<"idle" | "ai-speaking" | "listening" | "processing">(
    "idle",
  )
  const [showResults, setShowResults] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [balance, setBalance] = useState<number | null>(null); // Added
  // ✅ UX Enhancement States
  const [thinkingStage, setThinkingStage] = useState(1)
  const [thinkingProgress, setThinkingProgress] = useState(0)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const pathname = usePathname(); // Added

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits")
        const data = await res.json()
        if (res.ok) {
          setBalance(data.balance ?? 0)
        }
      } catch (error) {
        console.error("Error fetching credits in AudioVideoInterviewer:", error)
      }
    }
    fetchCredits();

    // Refresh credits every 30 seconds or on pathname change
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [pathname]); // Depend on pathname to re-fetch credits when URL changes

  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const faceAnalysisRef = useRef<FaceAnalysisRef>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const [micChecked, setMicChecked] = useState(false)
  const [cameraChecked, setCameraChecked] = useState(false)
  const [isMicTesting, setIsMicTesting] = useState(false)
  const [isCameraTesting, setIsCameraTesting] = useState(false)
  const [micTestStream, setMicTestStream] = useState<MediaStream | null>(null)
  const [cameraTestStream, setCameraTestStream] = useState<MediaStream | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const micCheckVideoRef = useRef<HTMLVideoElement>(null)
  const micCheckAudioContextRef = useRef<AudioContext | null>(null)
  const micTestAbortRef = useRef<AbortController | null>(null)
  const cameraTestAbortRef = useRef<AbortController | null>(null)
  
  // Mic sensitivity and calibration states
  const [micSensitivity, setMicSensitivity] = useState<number>(50)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [calibratedThreshold, setCalibratedThreshold] = useState<number | null>(null)
  const [audioThreshold, setAudioThreshold] = useState<number>(40)

  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef<string>("")
  const lastProcessedResponseRef = useRef<string>("")
  const lastProcessedQuestionRef = useRef<number>(0)
  const isProcessingRef = useRef<boolean>(false)
  const nextQuestionRef = useRef<{ text: string; questionNum: number } | null>(null)
  const preloadedQuestionsRef = useRef<Array<{ text: string }>>([])

  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt" | "checking">("checking")
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt" | "checking">("checking")

  const {
    startListening,
    stopListening,
    transcript: speechTranscript,
    isDetectingSpeech,
    resetTranscript,
  } = useSpeechRecognition()
  const { speak, isSpeaking } = useTextToSpeech({ rate: 0.9, delayBeforePlayMs: 1000 }); // Pre-load voice, play after 1 sec
  const supabase = createClient()

  const voiceAgent = useVoiceAgent({
    audioDeviceId,
    onUserSpeechStart: () => {
      console.log("[v0] Voice Agent: User started speaking")
      setConversationState("listening")
    },
    onUserSpeechEnd: (transcript: string, analysis) => {
      console.log(
        "[v0] Voice Agent: User stopped speaking",
        "| LLM says complete:",
        analysis.llmIsComplete,
        "| Confidence:",
        analysis.llmConfidence,
        "| Reason:",
        analysis.llmReasoning,
      )
      setConversationState("processing")
      setUserResponse(transcript)
      handleProcessUserResponse(transcript)
    },
    onTranscriptUpdate: (transcript: string, analysis) => {
      // Show live transcript in UI for feedback
      console.log(
        "[v0] Live transcript update:",
        transcript.substring(0, 30),
        "| LLM complete:",
        analysis.llmIsComplete,
        "| Confidence:",
        analysis.llmConfidence?.toFixed(2),
        "| Reason:",
        analysis.llmReasoning,
      )
    },
    onInterrupt: () => {
      console.log("[v0] Voice Agent: User interrupted AI")
      window.speechSynthesis?.cancel()
      setConversationState("listening")
    },
    enableBargeIn: true,
    audioThreshold: 30, // Low threshold for reliable speech detection
    currentQuestion: currentQuestion,
  })

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

  useEffect(() => {
    voiceAgent.setAISpeaking(conversationState === "ai-speaking")
  }, [conversationState, voiceAgent])

  // ✅ Animate thinking stages for better UX
  useEffect(() => {
    if (isAIThinking) {
      setThinkingStage(1)
      setThinkingProgress(10)
      
      const stage1 = setTimeout(() => {
        setThinkingStage(2)
        setThinkingProgress(50)
      }, 600)
      
      const stage2 = setTimeout(() => {
        setThinkingStage(3)
        setThinkingProgress(85)
      }, 1200)
      
      return () => {
        clearTimeout(stage1)
        clearTimeout(stage2)
      }
    } else {
      setThinkingProgress(100)
    }
  }, [isAIThinking])

  // ✅ Show success message after response
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSuccessMessage])

  // Listen for a global stop event (triggered by Results page) to stop any active voice/TTS
  useEffect(() => {
    const handler = () => {
      try {
        console.log('[v0] audio-video-interviewer: received app:stop-voice-agent event, stopping voice and TTS')
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
        voiceAgent.stopListening()
        voiceAgent.setAISpeaking(false)
      } catch (err) {
        console.warn('[v0] audio-video-interviewer: failed to stop voice agent on stop event', err)
      }
    }

    window.addEventListener('app:stop-voice-agent', handler as EventListener)
    return () => window.removeEventListener('app:stop-voice-agent', handler as EventListener)
  }, [voiceAgent])

  // Load saved calibration on mount
  useEffect(() => {
    const savedCalibration = loadCalibration()
    if (savedCalibration) {
      setCalibratedThreshold(savedCalibration.threshold)
      setAudioThreshold(savedCalibration.threshold)
      const sensitivity = thresholdToSensitivity(savedCalibration.threshold)
      setMicSensitivity(sensitivity)
      console.log('[v0] Loaded saved calibration:', savedCalibration)
    } else {
      // Load saved sensitivity preference if no calibration
      const savedSensitivity = localStorage.getItem('mic_sensitivity')
      if (savedSensitivity) {
        const sens = Number(savedSensitivity)
        setMicSensitivity(sens)
        setAudioThreshold(sensitivityToThreshold(sens))
      }
    }
  }, [])

  // Update threshold when sensitivity changes
  useEffect(() => {
    const newThreshold = calibratedThreshold 
      ? sensitivityToThreshold(micSensitivity, calibratedThreshold)
      : sensitivityToThreshold(micSensitivity)
    
    setAudioThreshold(newThreshold)
    localStorage.setItem('mic_sensitivity', micSensitivity.toString())
    console.log('[v0] Sensitivity:', micSensitivity, '-> Threshold:', newThreshold)
  }, [micSensitivity, calibratedThreshold])

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check microphone permission
        const micResult = await navigator.permissions.query({ name: "microphone" as PermissionName })
        setMicPermission(micResult.state as "granted" | "denied" | "prompt")

        // Check camera permission
        const cameraResult = await navigator.permissions.query({ name: "camera" as PermissionName })
        setCameraPermission(cameraResult.state as "granted" | "denied" | "prompt")

        // Listen for permission changes
        micResult.onchange = () => setMicPermission(micResult.state as "granted" | "denied" | "prompt")
        cameraResult.onchange = () => setCameraPermission(cameraResult.state as "granted" | "denied" | "prompt")
      } catch (error) {
        console.error("[v0] Permission check failed:", error)
        setMicPermission("prompt")
        setCameraPermission("prompt")
      }
    }

    checkPermissions()
  }, [])

  const testMicrophone = async () => {
    if (isMicTesting) return

    try {
      setIsMicTesting(true)
      if (micTestAbortRef.current) {
        micTestAbortRef.current.abort()
      }
      micTestAbortRef.current = new AbortController()

      console.log("[v0] Testing microphone...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      if (micTestAbortRef.current.signal.aborted) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      setMicTestStream(stream)
      setMicPermission("granted")
      console.log("[v0] Microphone access granted")

      // Analyze audio levels with enhanced settings
      const audioContext = new AudioContext()
      micCheckAudioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      // Add gain node for volume control
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 1.0 // Default gain
      
      microphone.connect(gainNode)
      gainNode.connect(analyser)
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      // Auto-calibrate if no saved calibration exists
      if (!calibratedThreshold && !isCalibrating) {
        setIsCalibrating(true)
        console.log("[v0] Auto-calibrating microphone...")
        
        try {
          const calibration = await calibrateMicrophone(analyser, dataArray, 2000)
          setCalibratedThreshold(calibration.threshold)
          setAudioThreshold(calibration.threshold)
          
          const sensitivity = thresholdToSensitivity(calibration.threshold)
          setMicSensitivity(sensitivity)
          
          // Adjust gain based on device profile
          gainNode.gain.value = calibration.recommendedGain
          
          saveCalibration(calibration)
          console.log("[v0] Calibration complete:", calibration)
        } catch (err) {
          console.error("[v0] Calibration failed:", err)
        } finally {
          setIsCalibrating(false)
        }
      }

      const checkLevel = () => {
        if (!micTestStream || micTestAbortRef.current?.signal.aborted) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setMicLevel(average)

        if (micTestStream && !micTestAbortRef.current?.signal.aborted) {
          requestAnimationFrame(checkLevel)
        }
      }

      checkLevel()
      setMicChecked(true)
      console.log("[v0] Microphone test successful")
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Microphone test was cancelled")
        return
      }

      console.error("[v0] Microphone test failed:", error)
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setMicPermission("denied")
        alert("Microphone access denied. Please allow microphone access in your browser settings and reload the page.")
      } else if (error.name === "NotFoundError") {
        alert("No microphone found on this device.")
      } else {
        alert("Unable to access microphone: " + error.message)
      }
    } finally {
      setIsMicTesting(false)
    }
  }

  const testCamera = async () => {
    if (isCameraTesting) return

    try {
      setIsCameraTesting(true)
      if (cameraTestAbortRef.current) {
        cameraTestAbortRef.current.abort()
      }
      cameraTestAbortRef.current = new AbortController()

      console.log("[v0] Testing camera...")
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      if (cameraTestAbortRef.current.signal.aborted) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      setCameraTestStream(stream)
      setCameraPermission("granted")
      console.log("[v0] Camera access granted")

      if (micCheckVideoRef.current) {
        micCheckVideoRef.current.srcObject = stream
        try {
          await micCheckVideoRef.current.play()
          console.log("[v0] Camera video playing")
        } catch (playError: unknown) {
          if ((playError as DOMException)?.name === "AbortError") return
          console.error("[v0] Error playing video:", playError)
        }
      } else {
        console.warn("[v0] Video ref not available")
      }

      setCameraChecked(true)
      console.log("[v0] Camera test successful")
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[v0] Camera test was cancelled")
        return
      }

      console.error("[v0] Camera test failed:", error)
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraPermission("denied")
        alert("Camera access denied. Please allow camera access in your browser settings and reload the page.")
      } else if (error.name === "NotFoundError") {
        alert("No camera found on this device.")
      } else {
        alert("Unable to access camera: " + error.message)
      }
    } finally {
      setIsCameraTesting(false)
    }
  }

  const stopDeviceTests = () => {
    if (micTestAbortRef.current) {
      micTestAbortRef.current.abort()
    }
    if (cameraTestAbortRef.current) {
      cameraTestAbortRef.current.abort()
    }

    if (micTestStream) {
      micTestStream.getTracks().forEach((track) => track.stop())
      setMicTestStream(null)
    }

    if (cameraTestStream) {
      cameraTestStream.getTracks().forEach((track) => track.stop())
      setCameraTestStream(null)
    }

    if (micCheckAudioContextRef.current) {
      micCheckAudioContextRef.current.close()
      micCheckAudioContextRef.current = null
    }

    setMicLevel(0)
  }

  useEffect(() => {
    return () => {
      stopDeviceTests()
    }
  }, [])

  const handleStartInterviewClick = () => {
    setShowSetupDialog(true)
  }

  const handleStartInterview = async () => {
    if (!selectedDuration || !selectedDifficulty) {
      return
    }

    // Show the credit confirmation dialog
    setShowSetupDialog(false)
    setShowStartConfirmDialog(true)
  }

  const confirmStartInterview = async () => {
    if (!selectedDuration || !selectedDifficulty) {
      return
    }

    setShowStartConfirmDialog(false)
    setHasStarted(true)
    
    const cost = getInterviewCost(selectedDuration, interviewType);
    if (balance !== null && balance < cost) {
      setError(`Not enough credits. This interview costs ${cost} credits, but you only have ${balance}.`);
      setIsLoading(false);
      return;
    }

    await startInterviewWithSettings(selectedDuration, selectedDifficulty)
  }

  const startInterviewWithSettings = async (duration: number, difficulty: string) => {
    console.log(
      "[v0] Starting interview, type:",
      interviewType,
      "duration:",
      duration,
      "minutes",
      "difficulty:",
      difficulty,
    )
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.log("[v0] Auth failed:", authError?.message || "No user found")
        console.log("[v0] Redirecting to auth page...")
        router.push("/auth")
        return
      }

      console.log("[v0] User authenticated, ID:", user.id)

      console.log("[v0] Creating interview session...")
      const response = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewType,
          userId: user.id,
          userEmail: user.email,
          userName: user.user_metadata?.name || user.email?.split("@")[0],
          duration,
          difficulty,
          customScenario: customScenario || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = errorData.error || `Failed to start interview: ${response.statusText}`;

        if (response.status === 402) {
          errorMessage = errorData.error || "Not enough credits to start this interview.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json()
      console.log("[v0] Interview session created:", data.interview?.id)

      if (data.interview) {
        setInterviewId(data.interview.id)
        setTotalQuestions(data.interview.question_count || 5)
        setShowWelcome(false)

        // Update interview context for navbar
        const cost = getInterviewCost(duration, interviewType)
        if (interviewContext) {
          interviewContext.setInterviewStarted(true)
          interviewContext.setCreditsUsed(cost)
          interviewContext.setTotalQuestions(data.interview.question_count || 5)
          interviewContext.setInterviewId(data.interview.id)
        }

        if (faceAnalysisRef.current) {
          await faceAnalysisRef.current.startCamera()
        }

        console.log("[v0] Generating first question...")
        await generateNextQuestion(data.interview.id, 1, [], user.id)
      } else {
        throw new Error("No interview data received")
      }
    } catch (error) {
      console.error("[v0] Error starting interview:", error)
      setError(error instanceof Error ? error.message : "Failed to start interview. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Removed useEffect that used scheduledInterviewId state, now handled by the new useEffect above.

  const prefetchNextQuestion = useCallback(
    (
      interviewSessionId: string,
      questionNum: number,
      previousAnswers: Array<{ question: string; answer: string }>,
      userId: string
    ) => {
      if (questionNum > totalQuestions) return
      fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewSessionId,
          interviewType,
          questionNumber: questionNum,
          previousAnswers,
          userId,
          customScenario: customScenario || null,
        }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Prefetch failed"))))
        .then((data) => {
          if (!data?.question) return
          const text = typeof data.question === "string" ? data.question : data.question?.question
          if (text) nextQuestionRef.current = { text, questionNum }
        })
        .catch(() => {})
    },
    [interviewType, customScenario, totalQuestions]
  )

  const generateNextQuestion = async (
    interviewSessionId: string,
    questionNum: number,
    previousAnswers: Array<{ question: string; answer: string }>,
    userId: string,
  ) => {
    setIsLoading(true)
    setIsAIThinking(true)
    setError(null)
    
    // ✅ Start thinking animation
    setThinkingStage(1)
    setThinkingProgress(0)

    // Pre-fetch next question while user will answer this one
    if (questionNum < totalQuestions) {
      prefetchNextQuestion(interviewSessionId, questionNum + 1, previousAnswers, userId)
    }

    try {
      let questionText: string | null = null

      // 1. Use pre-loaded Q1, Q2, Q3 from prepare (if available)
      const preloaded = preloadedQuestionsRef.current[questionNum - 1]
      if (preloaded?.text) {
        questionText = preloaded.text
      }
      // 2. Use pre-fetched question if ready
      if (!questionText && nextQuestionRef.current?.questionNum === questionNum) {
        questionText = nextQuestionRef.current.text
        nextQuestionRef.current = null
      }
      // 3. Fetch if not cached
      if (!questionText) {
        console.log("[v0] Generating question", questionNum)
        console.log("[v0] Previous answers count:", previousAnswers.length)
        if (previousAnswers.length > 0) {
          console.log("[v0] Last answer:", previousAnswers[previousAnswers.length - 1].answer.substring(0, 50))
        }
        const response = await fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewSessionId,
          interviewType,
          questionNumber: questionNum,
          previousAnswers, // This is correctly passed
          userId: userId,
          customScenario: customScenario || null,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Failed to generate question"
        try {
          const errorData = await response.json()
          console.log("[v0] API error response:", errorData)
          errorMessage = errorData.error || errorData.message || response.statusText || "Unknown error"
          if (errorData.details) {
            console.log("[v0] Error details:", errorData.details)
          }
        } catch (parseError) {
          console.log("[v0] Could not parse error response:", parseError)
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

        const data = await response.json()
        console.log("[v0] Question generated:", data.question)
        questionText = typeof data.question === "string" ? data.question : data.question?.question
      }

      if (questionText) {
        setCurrentQuestion(questionText)
        setConversationState("ai-speaking")
        setIsAIThinking(false)

        // CRITICAL: Stop listening BEFORE AI speaks to prevent picking up AI voice
        console.log("[v0] Stopping voice agent before AI speaks...")
        voiceAgent.stopListening()
        voiceAgent.setAISpeaking(true)

        stopAllSpeech()
        
        // Small delay to ensure voice agent is fully stopped
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const speakResult = speak(questionText)
        if (speakResult && typeof speakResult.then === "function") {
          speakResult
            .then(() => {
              if (!isInterviewComplete) {
                console.log("[v0] AI finished speaking, waiting before listening...")
                // Wait 1 second after AI finishes before starting to listen
                setTimeout(() => {
                  console.log("[v0] Now starting to listen for user...")
                  voiceAgent.setAISpeaking(false)
                  setConversationState("listening")
                  voiceAgent.startListening()
                }, 1000)
              }
            })
            .catch((err) => {
              console.error("[v0] Error during speech:", err)
              if (!isInterviewComplete) {
                setTimeout(() => {
                  voiceAgent.setAISpeaking(false)
                  setConversationState("listening")
                  voiceAgent.startListening()
                }, 1000)
              }
            })
        } else {
          console.log("[v0] Speak didn't return promise, starting listening after delay...")
          if (!isInterviewComplete) {
            // If speak doesn't return promise, estimate speech duration
            const wordCount = questionText.split(' ').length
            const estimatedDuration = Math.max(3000, wordCount * 300) // ~300ms per word, min 3 seconds
            console.log("[v0] Estimated speech duration:", estimatedDuration, "ms")
            setTimeout(() => {
              voiceAgent.setAISpeaking(false)
              setConversationState("listening")
              voiceAgent.startListening()
            }, estimatedDuration)
          }
        }

        setTranscript((prev) => [
          ...prev,
          {
            type: "ai",
            content: data.question,
            timestamp: new Date(),
            questionNumber: questionNum,
          },
        ])
      } else {
        throw new Error("No question received from server")
      }
    } catch (error) {
      console.error("[v0] Error generating question:", error)
      if (error instanceof Error) {
        console.error("[v0] Error message:", error.message)
        console.error("[v0] Error stack:", error.stack)
      }
      const errorMsg = error instanceof Error ? error.message : "Failed to generate question. Please try again."
      setError(errorMsg)
      setIsAIThinking(false)
      setConversationState("idle")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcessUserResponse = async (transcript: string) => {
    if (isProcessingRef.current || !transcript.trim()) {
      return
    }

    const finalResponse = transcript.trim()
    const qNum = currentQuestionIndex + 1

    if (finalResponse === lastProcessedResponseRef.current || lastProcessedQuestionRef.current === qNum) {
      return
    }

    isProcessingRef.current = true
    lastProcessedQuestionRef.current = qNum
    setIsProcessingResponse(true)
    setConversationState("processing")

    voiceAgent.stopListening()

    if (!finalResponse || !interviewId) {
      isProcessingRef.current = false
      setIsProcessingResponse(false)
      setTimeout(() => {
        setConversationState("listening")
        voiceAgent.startListening()
      }, 300)
      return
    }

    lastProcessedResponseRef.current = finalResponse

    // ✅ OPTIMISTIC UI UPDATE - Show user's response immediately
    setTranscript((prev) => [
      ...prev,
      {
        type: "user",
        content: finalResponse,
        timestamp: new Date(),
      },
    ])

    setIsLoading(true)
    try {
      // ✅ PARALLEL PROCESSING - Run DB save and user fetch simultaneously
      const [saveResponse, userData] = await Promise.all([
        fetch("/api/interview/response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            question: currentQuestion,
            answer: finalResponse,
            questionNumber: currentQuestionIndex + 1,
            skipped: false,
          }),
        }),
        supabase.auth.getUser()
      ])

      const responseData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(responseData.error || "Failed to save response")
      }

      const newResponses = [...responses, { question: currentQuestion, answer: finalResponse }]
      setResponses(newResponses)

      setUserResponse("")
      lastProcessedResponseRef.current = ""
      isProcessingRef.current = false
      setIsProcessingResponse(false)
      
      // ✅ Show success feedback
      setShowSuccessMessage(true)

      if (currentQuestionIndex < totalQuestions - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextQuestionIndex)
        
        // Update questions answered in context
        if (interviewContext) {
          interviewContext.setQuestionsAnswered(nextQuestionIndex)
        }
        
        // ✅ Start generating next question immediately (don't block UI)
        if (userData.data.user) {
          setConversationState("ai-speaking")
          // Remove await - start generation without blocking
          generateNextQuestion(interviewId, nextQuestionIndex + 1, newResponses, userData.data.user.id)
        }
      } else {
        // Update final questions answered count
        if (interviewContext) {
          interviewContext.setQuestionsAnswered(totalQuestions)
        }
        await handleInterviewCompletion(newResponses)
      }
    } catch (error) {
      console.error("[v0] Error processing response:", error)
      setError(error instanceof Error ? error.message : "Error saving your response. Please try again.")
      isProcessingRef.current = false
      setIsProcessingResponse(false)
      setIsLoading(false)
      setConversationState("idle")
    }
  }

  const handleEndInterview = () => {
    if (showResults) return
    // Show confirmation dialog instead of immediately ending
    setShowEndConfirmDialog(true)
  }

  const confirmEndInterview = async () => {
    setShowEndConfirmDialog(false)
    stopAllSpeech()
    await completeInterview()
  }

  const handleSkipQuestion = async () => {
    voiceAgent.stopListening()
    setShowSkipConfirm(false)

    if (!interviewId) return

    try {
      setIsLoading(true)

      console.log("[v0] Saving skipped question...")
      const saveResponse = await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          question: currentQuestion,
          answer: "[SKIPPED]",
          questionNumber: currentQuestionIndex + 1,
          skipped: true,
        }),
      })

      if (!saveResponse.ok) {
        console.error("[v0] Failed to save skipped question")
      }

      const newResponses = [...responses, { question: currentQuestion, answer: "[SKIPPED]" }]
      setResponses(newResponses)

      setUserResponse("")
      resetTranscript()
      lastTranscriptRef.current = ""

      if (currentQuestionIndex < totalQuestions - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextQuestionIndex)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          await generateNextQuestion(interviewId, nextQuestionIndex + 1, newResponses, user.id)
        } else {
          // Fallback: still attempt to generate question without explicit user id
          await generateNextQuestion(interviewId, nextQuestionIndex + 1, newResponses, interviewId)
        }
      } else {
        await handleInterviewCompletion(newResponses)
      }
    } catch (error) {
      console.error("[v0] Error skipping question:", error)
      setError("Error processing skip. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInterviewCompletion = async (finalResponses: Array<{ question: string; answer: string }>) => {
    console.log("[v0] Interview completed, starting analysis...")
    setIsInterviewComplete(true)
    voiceAgent.stopListening()

    const completionMessage =
      "Thank you for your responses! Your interview is now complete. Analyzing your performance..."

    setTranscript((prev) => [
      ...prev,
      {
        type: "ai",
        content: completionMessage,
        timestamp: new Date(),
      },
    ])

    stopAllSpeech()
    const speakResult = speak(completionMessage)
    if (speakResult && typeof speakResult.then === "function") {
      speakResult.catch((err) => {
        console.error("[v0] Error speaking completion message:", err)
      })
    }

    // Get face metrics before stopping camera
    const faceMetrics = faceAnalysisRef.current?.getAverageMetrics()

    // Stop the camera
    if (faceAnalysisRef.current) {
      faceAnalysisRef.current.stopCamera()
    }

    // Calculate questions skipped
    const questionsSkipped = finalResponses.filter((r) => r.answer.includes("[SKIPPED]")).length

    setIsGeneratingAnalysis(true)

    try {
      console.log("[v0] Calling analyze API...", { interviewId, scheduleId: scheduledInterviewId || scheduledInterviewIdState })

      if (!interviewId) {
        console.error("[v0] handleInterviewCompletion: missing interviewId, aborting analysis")
        setError("Analysis failed: interview session missing (no interviewId)")
        setIsGeneratingAnalysis(false)
        return
      }

      const analysisResponse = await fetch("/api/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          interviewType,
          faceMetrics: faceMetrics || undefined,
          questionsSkipped,
          customScenario: customScenario || null,
          scheduleId: scheduledInterviewId || scheduledInterviewIdState || undefined,
        }),
      })

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json() // Corrected: use analysisResponse here
        console.log("[v0] Analysis completed successfully:", analysisData)

        // ✅ Skip intermediate results display - go directly to results page
        setIsGeneratingAnalysis(false)
        
        // Stop voice agent speech and any ongoing TTS
        try {
          stopAllSpeech()
          voiceAgent.stopListening()
          voiceAgent.setAISpeaking(false)
        } catch (stopErr) {
          console.error('[v0] Error stopping voice agent or TTS after interview end:', stopErr)
        }

        // ✅ Navigate immediately to results page (removed delay)
        try {
          if (interviewId) {
            // Fetch batchId in background (don't wait)
            fetch(`/api/interview/results?interviewId=${interviewId}`)
              .then(res => res.ok ? res.json() : null)
              .then(json => json?.batchId && setBatchId(json.batchId))
              .catch(err => console.warn('[v0] Could not fetch batchId:', err))
            
            // Navigate immediately
            router.push(`/results?interviewId=${interviewId}`)
          }
        } catch (navErr) {
          console.error('[v0] Failed to navigate to results page:', navErr)
        }
      } else {
        const errorData = await analysisResponse.json() // Corrected: use analysisResponse here
        const errorMsg = errorData.error || analysisResponse.statusText // Corrected: use analysisResponse here
        console.error("[v0] Analysis API error:", errorMsg)
        throw new Error(`Analysis failed: ${errorMsg}`)
      }
    } catch (error) {
      console.error("[v0] Error during interview completion:", error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("[v0] Full error details:", errorMsg)

      // If the error mentions the missing scheduled_interview_id column, show a clearer actionable message
      if (/scheduled_interview_id|column .*does not exist/i.test(errorMsg)) {
        setError(
          `Error analyzing interview: ${errorMsg}. This server is missing a DB migration (scripts/011_add_scheduled_interview_id_to_interviews.sql). Please apply the migration and restart the dev server.`,
        )
      } else {
        setError(`Error analyzing interview: ${errorMsg}`)
      }

      setIsGeneratingAnalysis(false)
    }
  }

  // ✅ Removed intermediate results display - navigates directly to results page now

  if (isGeneratingAnalysis) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Analyzing Your Performance</h2>
          <p className="text-lg text-gray-600 mb-4">
            Our AI is reviewing your responses and generating detailed feedback...
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">This usually takes 10-15 seconds</p>
          </div>
        </div>
      </div>
    )
  }

  if (showWelcome) {
    const browserOk = isChromeOrEdge()
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 md:gap-6 p-4 md:p-8">
        <div className="text-center max-w-2xl w-full">
          {!browserOk && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-red-700 font-semibold">⚠️ {BROWSER_REQUIRED_MESSAGE}</p>
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Welcome to Your AI Interview</h1>
          <p className="text-base md:text-lg text-gray-600 mb-6 md:mb-8">
            This is a real {interviewType} interview powered by AI. You'll answer questions and receive detailed
            performance feedback.
          </p>

          {customScenario && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Custom Scenario</h2>
              <div className="text-left space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                <p>
                  <span className="font-semibold">Description:</span> {customScenario.description}
                </p>
                <div>
                  <span className="font-semibold">Goals:</span>
                  <ul className="ml-4 list-disc">
                    {customScenario.goals.map((goal, i) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold">Focus Areas:</span>
                  <ul className="ml-4 list-disc">
                    {customScenario.focusAreas.map((area, i) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </div>
                {customScenario.context && (
                  <p>
                    <span className="font-semibold">Context:</span> {customScenario.context}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Interview Tips:</h2>
            <ul className="text-left space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
              <li className="flex gap-2 md:gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Speak clearly and loudly - ensure your microphone picks up your voice</span>
              </li>
              <li className="flex gap-2 md:gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Take your time to think before answering</span>
              </li>
              <li className="flex gap-2 md:gap-3">
                <span className="text-blue-600 font-bold">•</span>
                <span>Use examples from your experience</span>
              </li>
              <li className="flex gap-2 md:gap-3">
                <span className="text-blue-600 font-bold text-lg">💡</span>
                <span><strong>Note:</strong> Use <strong>Chrome</strong> or <strong>Edge</strong> for the best experience. Other browsers are not supported.</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 md:p-6 mb-6 md:mb-8 space-y-3 md:space-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Device Check</h2>
            <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">Test your microphone (required). Camera test is optional.</p>

            {/* Microphone Sensitivity Slider */}
            {micTestStream && (
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Microphone Sensitivity: {micSensitivity}%
                    </label>
                    {isCalibrating && (
                      <span className="text-xs text-blue-600 animate-pulse">Calibrating...</span>
                    )}
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={micSensitivity}
                    onChange={(e) => setMicSensitivity(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Less Sensitive</span>
                    <span>More Sensitive</span>
                  </div>
                  
                  {/* Visual feedback for voice detection */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Audio Level</span>
                      <span className={`font-medium ${micLevel > audioThreshold ? 'text-green-600' : 'text-gray-400'}`}>
                        {micLevel > audioThreshold ? '✓ Voice Detected' : 'Speak to test'}
                      </span>
                    </div>
                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      {/* Current level bar */}
                      <div
                        className={`h-full transition-all duration-100 ${
                          micLevel > audioThreshold ? 'bg-green-500' : 'bg-blue-400'
                        }`}
                        style={{ width: `${Math.min(100, (micLevel / 100) * 100)}%` }}
                      />
                      {/* Threshold marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                        style={{ left: `${(audioThreshold / 100) * 100}%` }}
                        title={`Threshold: ${audioThreshold}`}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Adjust if your voice isn't detected or if background noise triggers detection.
                    {calibratedThreshold && (
                      <span className="block mt-1 text-blue-600">
                        ✓ Auto-calibrated for your device
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Microphone Check */}
              <div>
                {micPermission === "denied" ? (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 font-semibold">🎤 Microphone Blocked</span>
                    </div>
                    <p className="text-xs text-gray-700 mb-3">Please enable microphone access:</p>
                    <ol className="text-xs text-gray-600 space-y-1 mb-3">
                      <li>1. Click the lock/info icon in the address bar</li>
                      <li>2. Find "Microphone" permissions</li>
                      <li>3. Change to "Allow"</li>
                      <li>4. Reload this page</li>
                    </ol>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                ) : !micTestStream ? (
                  <button
                    onClick={testMicrophone}
                    disabled={isMicTesting} // Disable button while testing
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium">{isMicTesting ? "Testing..." : "Test Mic"}</span>{" "}
                    {/* Update button text */}
                  </button>
                ) : (
                  <div className="bg-white border-2 border-green-500 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Microphone</span>
                      <span className="text-green-600 text-sm font-semibold">✓</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-green-500 transition-all duration-100"
                        style={{ width: `${Math.min(100, (micLevel / 128) * 100)}%` }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        stopDeviceTests()
                        setMicChecked(false)
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Check (Optional) */}
              <div>
                {cameraPermission === "denied" ? (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-red-600 font-semibold">📷 Camera Blocked</span>
                    </div>
                    <p className="text-xs text-gray-700 mb-3">Please enable camera access:</p>
                    <ol className="text-xs text-gray-600 space-y-1 mb-3">
                      <li>1. Click the lock/info icon in the address bar</li>
                      <li>2. Find "Camera" permissions</li>
                      <li>3. Change to "Allow"</li>
                      <li>4. Reload this page</li>
                    </ol>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Reload Page
                    </button>
                  </div>
                ) : !cameraTestStream ? (
                  <button
                    onClick={testCamera}
                    disabled={isCameraTesting} // Disable button while testing
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-medium">{isCameraTesting ? "Testing..." : "Test Camera"}</span>{" "}
                    {/* Update button text */}
                  </button>
                ) : (
                  <div className="bg-white border-2 border-green-500 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Camera</span>
                      <span className="text-green-600 text-sm font-semibold">✓</span>
                    </div>
                    <div className="relative rounded overflow-hidden bg-gray-900 h-20 mb-2">
                      <video ref={micCheckVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <button
                      onClick={() => {
                        stopDeviceTests()
                        setCameraChecked(false)
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleStartInterviewClick}
            disabled={isLoading || !micChecked || !browserOk}
            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!browserOk ? "Use Chrome or Edge to Continue" : isLoading ? "Starting Interview..." : "Start Interview"}
          </button>
        </div>

        <AlertDialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl">Setup Your Interview</AlertDialogTitle>
              <AlertDialogDescription>
                Choose your session length and difficulty level to get started
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid grid-cols-2 gap-6 py-4">
              {/* Duration Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Session Length</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDuration(15)}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDuration === 15
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">15 min</div>
                    <div className="text-sm text-gray-500">Quick Warmup</div>
                  </button>

                  <button
                    onClick={() => setSelectedDuration(30)}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDuration === 30
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">30 min</div>
                    <div className="text-sm text-gray-500">Standard Mock</div>
                  </button>

                  <button
                    onClick={() => setSelectedDuration(45)}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDuration === 45
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">45 min</div>
                    <div className="text-sm text-gray-500">Extended Session</div>
                  </button>

                  <button
                    onClick={() => setSelectedDuration(60)}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDuration === 60
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-semibold text-gray-900">60 min</div>
                    <div className="text-sm text-gray-500">Full Interview</div>
                  </button>
                </div>
              </div>

              {/* Difficulty Selection */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Difficulty Level</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedDifficulty("beginner")}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDifficulty === "beginner"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🌱</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Beginner</div>
                        <div className="text-sm text-gray-500">Basic fundamentals</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDifficulty("intermediate")}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDifficulty === "intermediate"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-yellow-300 hover:bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📚</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Intermediate</div>
                        <div className="text-sm text-gray-500">Practical applications</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDifficulty("pro")}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDifficulty === "pro"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚀</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Pro</div>
                        <div className="text-sm text-gray-500">Advanced techniques</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedDifficulty("advanced")}
                    className={`w-full p-3 text-left border-2 rounded-lg transition-all ${
                      selectedDifficulty === "advanced"
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔥</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">Advanced</div>
                        <div className="text-sm text-gray-500">Expert-level</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <button
                onClick={handleStartInterview}
                disabled={!selectedDuration || !selectedDifficulty}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Interview
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Start Interview Credit Confirmation Dialog - for welcome screen */}
        <StartInterviewDialog
          isOpen={showStartConfirmDialog}
          onClose={() => setShowStartConfirmDialog(false)}
          onConfirm={confirmStartInterview}
          creditCost={selectedDuration ? getInterviewCost(selectedDuration, interviewType) : 0}
          currentBalance={balance ?? 0}
          duration={selectedDuration ?? 15}
          difficulty={selectedDifficulty ?? "intermediate"}
          interviewType={interviewType}
        />
      </div>
    )
  }

  // Removed LandscapePrompt component
  return (
    <div className="flex flex-col h-full min-h-0 interview-mobile-optimized relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden p-4">
        <div className="w-full h-full max-w-[1380px] mx-auto flex flex-col lg:flex-row gap-2 md:gap-4" style={{ transform: 'scale(0.92)', transformOrigin: 'center center' }}>
        <div className="flex-1 flex flex-col gap-2 md:gap-3 min-w-0 min-h-0 overflow-hidden">
          {error && (
            <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 min-h-0">
            <div className="relative rounded-xl overflow-hidden" data-tour="tour-settings">
              <button
                  onClick={() => setShowMediaSettings(true)}
                  className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                  title="Change camera and microphone"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <FaceAnalysis ref={faceAnalysisRef} videoDeviceId={videoDeviceId} />
            </div>

            <div className="rounded-xl bg-white p-2 md:p-4 flex flex-col items-center justify-center gap-2 md:gap-4 relative min-h-[160px] md:min-h-0">
              {voiceAgent.liveTranscript && voiceAgent.currentAnalysis && (
                <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4 bg-blue-50 border border-blue-200 rounded-lg p-2 md:p-3">
                  <div className="flex items-start justify-between gap-2 mb-1 md:mb-2">
                    <p className="text-xs font-medium text-blue-600">Live Transcript:</p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-gray-500">{voiceAgent.currentAnalysis.wordCount} words</span>
                      {voiceAgent.currentAnalysis.llmConfidence !== undefined && (
                        <span
                          className={`font-semibold ${voiceAgent.currentAnalysis.llmIsComplete ? "text-green-600" : "text-amber-600"}`}
                        >
                          {voiceAgent.currentAnalysis.llmIsComplete ? "✓" : "..."}{" "}
                          {(voiceAgent.currentAnalysis.llmConfidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {/* Removed llmReasoning from here as it was not being used and could clutter the UI */}
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-700 line-clamp-2">{voiceAgent.liveTranscript}</p>
                </div>
              )}

              <div className="text-center">
                {conversationState === "ai-speaking" && (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <AudioReactiveOrb audioLevel={voiceAgent.audioLevel} isActive={true} isSpeaking={false} />
                    <p className="text-xs md:text-sm font-medium text-blue-600">AI is speaking...</p>
                  </div>
                )}

                {conversationState === "listening" && (
                  <div className="flex flex-col items-center gap-3 md:gap-4">
                    <AudioReactiveOrb
                      audioLevel={voiceAgent.audioLevel}
                      isActive={true}
                      isSpeaking={voiceAgent.isSpeechDetected}
                    />
                    
                    {/* Status indicator */}
                    <div className="text-center">
                      <p className="text-sm md:text-base font-medium text-green-600">
                        {voiceAgent.isTranscribing 
                          ? "🔄 Processing your speech..." 
                          : voiceAgent.isSpeechDetected 
                            ? "🎙️ Recording your answer..." 
                            : "👂 Speak when ready"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {voiceAgent.liveTranscript 
                          ? "Click 'Submit Answer' when done" 
                          : "Take your time to answer completely"}
                      </p>
                    </div>

                    {/* Audio level indicator */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Mic:</span>
                      <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-100 ${voiceAgent.audioLevel > 30 ? 'bg-green-500' : 'bg-gray-400'}`}
                          style={{ width: `${Math.min(100, voiceAgent.audioLevel * 1.5)}%` }}
                        />
                      </div>
                      <span className={voiceAgent.audioLevel > 30 ? 'text-green-600 font-medium' : ''}>
                        {voiceAgent.audioLevel > 30 ? '🟢' : '⚪'}
                      </span>
                    </div>

                    {/* Live transcript display */}
                    {voiceAgent.liveTranscript && (
                      <div className="mt-2 max-w-lg w-full px-4">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Your answer so far:</p>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 max-h-32 overflow-y-auto">
                          <p className="text-sm text-gray-800">
                            {voiceAgent.liveTranscript}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Submit button - always visible, more prominent when there's content */}
                    <div data-tour="tour-start-answer">
                    <button
                      onClick={() => {
                        console.log("[v0] Manual submit clicked")
                        voiceAgent.manualSubmit()
                      }}
                      disabled={!voiceAgent.liveTranscript && !voiceAgent.isSpeechDetected}
                      className={`mt-4 px-8 py-4 text-white text-base font-semibold rounded-xl transition-all flex items-center gap-3 shadow-lg ${
                        voiceAgent.liveTranscript 
                          ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                      title="Click when you're done with your answer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Submit Answer
                    </button>
                    </div>
                    
                    {!voiceAgent.liveTranscript && (
                      <p className="text-xs text-gray-400 italic">
                        Speak your complete answer, then click Submit
                      </p>
                    )}
                  </div>
                )}

                {conversationState === "processing" && (
                  <div className="flex flex-col items-center gap-3">
                    <AudioReactiveOrb audioLevel={voiceAgent.audioLevel * 0.5} isActive={true} isSpeaking={false} />
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-amber-600">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-xs md:text-sm font-medium animate-pulse">Saving your answer...</p>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                {conversationState === "idle" && (
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <AudioReactiveOrb audioLevel={0} isActive={false} isSpeaking={false} />
                    <p className="text-xs md:text-sm font-medium text-gray-500">Ready</p>
                  </div>
                )}

                {isAIThinking && (
                  <div className="flex flex-col items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 text-purple-600">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-xs md:text-sm font-medium">
                        {thinkingStage === 1 && "Analyzing your response..."}
                        {thinkingStage === 2 && "Preparing next question..."}
                        {thinkingStage === 3 && "Almost ready..."}
                      </p>
                    </div>
                    <div className="w-40 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full transition-all duration-500 ease-out" 
                        style={{width: `${thinkingProgress}%`}}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* ✅ Success Message */}
                {showSuccessMessage && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-semibold">Answer Recorded! ✓</span>
                  </div>
                )}
              </div>

              <AudioVisualizer isActive={voiceAgent.isListening} isDetectingSpeech={voiceAgent.isSpeechDetected} />

              {userResponse && (
                <div className="max-w-md px-2 md:px-0">
                  <p className="text-xs text-gray-500 mb-1">Your response:</p>
                  <p className="text-xs md:text-sm text-gray-700 bg-gray-50 p-2 md:p-3 rounded-lg border border-gray-200">
                    {userResponse}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              {selectedDuration && <InterviewTimer durationMinutes={selectedDuration} onTimeUp={handleTimeUp} />}
            </div>
            <div className="flex gap-2 md:gap-3 justify-center">
              <button
                onClick={() => setShowEvaluationCriteria(true)}
                data-tour="tour-evaluation-criteria"
                className="w-full md:w-auto px-4 md:px-6 py-1.5 md:py-3 border-2 border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-all text-sm md:text-base flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                Evaluation Criteria
              </button>
              <button
                onClick={handleEndInterview}
                className="w-full md:w-auto px-4 md:px-8 py-1.5 md:py-3 border-2 border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 transition-all text-sm md:text-base"
              >
                End Interview
              </button>
            </div>
          </div>

          <AlertDialog open={showSkipConfirm} onOpenChange={setShowSkipConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Skip This Question?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <div>It might affect your impression score.</div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-sm text-amber-900 font-medium">
                        ⚠ Skipping questions may negatively impact your performance evaluation.
                      </div>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <button
                  onClick={handleSkipQuestion}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all"
                >
                  Skip Question
                </button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <EvaluationCriteriaDialog
            open={showEvaluationCriteria}
            onOpenChange={setShowEvaluationCriteria}
            interviewType={interviewType}
          />
          <MediaDeviceSelectionDialog
            open={showMediaSettings}
            onOpenChange={setShowMediaSettings}
            currentVideoId={videoDeviceId}
            currentAudioId={audioDeviceId}
            onDevicesChange={(vid, aid) => {
              setVideoDeviceId(vid)
              setAudioDeviceId(aid)
              if (voiceAgent.isListening && aid) {
                voiceAgent.stopListening()
                setTimeout(() => voiceAgent.startListening(), 300)
              }
            }}
          />
          {/* End Interview Confirmation Dialog */}
          <ExitInterviewDialog
            isOpen={showEndConfirmDialog}
            onClose={() => setShowEndConfirmDialog(false)}
            onConfirm={confirmEndInterview}
            isInterviewStarted={hasStarted}
            creditsUsed={selectedDuration ? getInterviewCost(selectedDuration, interviewType) : 0}
            questionsAnswered={currentQuestionIndex}
            totalQuestions={totalQuestions}
          />

          {/* Start Interview Credit Confirmation Dialog */}
          <StartInterviewDialog
            isOpen={showStartConfirmDialog}
            onClose={() => setShowStartConfirmDialog(false)}
            onConfirm={confirmStartInterview}
            creditCost={selectedDuration ? getInterviewCost(selectedDuration, interviewType) : 0}
            currentBalance={balance ?? 0}
            duration={selectedDuration ?? 15}
            difficulty={selectedDifficulty ?? "intermediate"}
            interviewType={interviewType}
          />
        </div>

        <div className="w-full lg:w-80 flex flex-col bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl overflow-hidden lg:flex-shrink-0 min-h-0">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2 md:p-3 flex-shrink-0">
            <h3 className="font-semibold text-sm">Interview Transcript</h3>
            <p className="text-blue-100 text-xs">Live conversation history</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 md:p-3 space-y-2 scroll-smooth min-h-0 transcript-scrollbar">
            {transcript.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                <p>Transcript will appear here once the interview starts</p>
              </div>
            ) : (
              transcript.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      message.type === "ai" ? "bg-blue-600" : "bg-gray-600"
                    }`}
                  >
                    {message.type === "ai" ? "AI" : "You"}
                  </div>

                  <div className={`flex-1 ${message.type === "user" ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {message.type === "ai" ? "AI Interviewer" : "Your Response"}
                      </span>
                      {message.questionNumber && (
                        <span className="text-xs text-gray-400">Q{message.questionNumber}</span>
                      )}
                    </div>
                    <div
                      className={`inline-block p-3 rounded-lg ${
                        message.type === "ai"
                          ? "bg-blue-50 border border-blue-200 text-gray-900"
                          : "bg-gray-100 border border-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
