"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AvatarVideoPlayer, { type AvatarVideoPlayerRef } from "./avatar-video-player"
import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"
import { ExitInterviewDialog } from "./exit-interview-dialog"
import { EvaluationCriteriaDialog } from "./evaluation-criteria-dialog"
import { MediaDeviceSelectionDialog } from "./media-device-selection-dialog"
import { useInterviewContext } from "@/contexts/interview-context"
import { Mic, Video, RefreshCw, LogOut, Info, Settings } from "lucide-react"
import { saveQuestionVideo } from "@/lib/interview-video-store"

// Credit costs for durations
const durationCredits: Record<number, number> = {
  5: 1,
  15: 3,
  30: 6,
  60: 12,
}

interface NewInterviewRoomProps {
  interviewType: string
  courseTitle?: string
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

export default function NewInterviewRoom({
  interviewType,
  courseTitle,
  customScenario,
  scheduledInterviewId,
}: NewInterviewRoomProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  // Get settings from URL params (set by config modal)
  const urlDuration = parseInt(searchParams.get("duration") || "15")
  const urlDifficulty = searchParams.get("difficulty") || "beginner"
  const urlInterviewer = (searchParams.get("interviewer") || "claire").replace("vivek", "claire")
  const urlRound = searchParams.get("round") || null
  const urlTopics = searchParams.get("topics")?.split(",").filter(Boolean) || []
  const urlVideo = searchParams.get("video") !== "false"
  const urlAudio = searchParams.get("audio") !== "false"
  
  // Refs
  const avatarRef = useRef<AvatarVideoPlayerRef>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const videoChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingIntroRef = useRef<{ interviewId: string; userId: string } | null>(null)
  const nextQuestionRef = useRef<{ text: string; questionNum: number; audioBase64?: string } | null>(null)
  const currentQuestionAudioRef = useRef<{ text: string; audioBase64: string } | null>(null)
  
  // Browser native speech recognition refs
  const recognitionRef = useRef<any>(null)
  const liveTranscriptRef = useRef<string>("")
  const lastFinalTranscriptRef = useRef<string>("")
  const isRecordingRef = useRef(false)
  
  // Interview context
  let interviewContext: ReturnType<typeof useInterviewContext> | null = null
  try {
    interviewContext = useInterviewContext()
  } catch {
    // Context not available
  }
  
  // State
  const tourComplete = true
  const [hasStarted, setHasStarted] = useState(false)
  const [isInterviewComplete, setIsInterviewComplete] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [showEvaluationCriteria, setShowEvaluationCriteria] = useState(false)
  const [showMediaSettings, setShowMediaSettings] = useState(false)
  const [videoDeviceId, setVideoDeviceId] = useState<string | null>(null)
  const [audioDeviceId, setAudioDeviceId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Array<{ question: string; answer: string }>>([])
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [userStream, setUserStream] = useState<MediaStream | null>(null)
  const [liveTranscript, setLiveTranscript] = useState("")
  
  // AI state
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Timer state - read from URL params
  const [timeRemaining, setTimeRemaining] = useState(urlDuration * 60)
  const selectedDuration = urlDuration
  const selectedDifficulty = urlDifficulty
  
  // Credit cost for this interview
  const creditCost = durationCredits[selectedDuration] || 1

  // Audio ref for TTS playback
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)

  // Map interviewer to voice (Claire uses INWORLD_VOICE_ID_CLAIRE from env; others use built-in)
  const interviewerToVoice: Record<string, string> = {
    claire: "claire",
    john: "alex",
    emma: "ashley",
    payal: "ashley",
    kapil: "alex",
  }
  const voiceId = interviewerToVoice[urlInterviewer] || "claire"

  // TTS using Inworld TTS 1.5 Mini API (uses INWORLD_VOICE_ID from env if set for cloned voice)
  // preFetchedAudio: base64 string - when provided, plays immediately (no API call)
  const speakText = useCallback(async (text: string, preFetchedAudio?: string): Promise<void> => {
    try {
      avatarRef.current?.playSpeaking()
      setIsAISpeaking(true)

      let audioContent = preFetchedAudio

      if (!audioContent) {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId }),
        })
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          console.warn("Inworld TTS failed, falling back to browser:", errData)
          throw new Error(errData.error || "TTS request failed")
        }
        const data = await response.json()
        audioContent = data.audioContent
      }

      if (audioContent) {
        // Cache TTS for repeat - no API call when user presses Repeat Question
        currentQuestionAudioRef.current = { text, audioBase64: audioContent }

        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))],
          { type: "audio/mp3" }
        )
        const audioUrl = URL.createObjectURL(audioBlob)

        return new Promise((resolve) => {
          const audio = new Audio(audioUrl)
          ttsAudioRef.current = audio

          audio.onended = () => {
            avatarRef.current?.playIdle()
            setIsAISpeaking(false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          audio.onerror = () => {
            avatarRef.current?.playIdle()
            setIsAISpeaking(false)
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          audio.play().catch((e) => {
            if (e?.name === "AbortError") { resolve(); return }
            avatarRef.current?.playIdle()
            setIsAISpeaking(false)
            resolve()
          })
        })
      }

      // Fallback to Web Speech API if TTS fails
      return fallbackSpeakText(text)
    } catch (error) {
      console.warn("TTS error, using browser voice:", error)
      return fallbackSpeakText(text)
    }
  }, [voiceId])

  // Fallback TTS using Web Speech API
  const fallbackSpeakText = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 0.9
        utterance.pitch = 1.0
        utterance.volume = 1.0
        
        utterance.onstart = () => {
          avatarRef.current?.playSpeaking()
          setIsAISpeaking(true)
        }
        
        utterance.onend = () => {
          avatarRef.current?.playIdle()
          setIsAISpeaking(false)
          resolve()
        }
        
        utterance.onerror = () => {
          avatarRef.current?.playIdle()
          setIsAISpeaking(false)
          resolve()
        }
        
        window.speechSynthesis.speak(utterance)
      } else {
        avatarRef.current?.playIdle()
        setIsAISpeaking(false)
        resolve()
      }
    })
  }, [])

  // Fetch credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits")
        const data = await res.json()
        if (res.ok) {
          setBalance(data.balance ?? 0)
        }
      } catch (error) {
        console.error("Error fetching credits:", error)
      }
    }
    fetchCredits()
  }, [pathname])

  // Setup user camera and microphone (respects video/audio from URL params)
  useEffect(() => {
    let stream: MediaStream | null = null
    const setupMedia = async () => {
      try {
        const constraints: MediaStreamConstraints = {}
        if (urlVideo) {
          constraints.video = videoDeviceId
            ? { deviceId: { exact: videoDeviceId } }
            : true
        }
        if (urlAudio) {
          constraints.audio = audioDeviceId
            ? { deviceId: { exact: audioDeviceId }, echoCancellation: true, noiseSuppression: true }
            : { echoCancellation: true, noiseSuppression: true }
        }
        if (!constraints.video && !constraints.audio) {
          constraints.audio = true
        }
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        setUserStream(stream)
        if (userVideoRef.current && stream.getVideoTracks().length > 0) {
          userVideoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error("Error accessing media devices:", error)
      }
    }
    if (hasStarted) {
      setupMedia()
    }
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [hasStarted, videoDeviceId, audioDeviceId, urlVideo, urlAudio])

  // Setup browser native speech recognition (Web Speech API) - runs once on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn("[Speech] Browser native speech recognition not supported")
      return
    }
    
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.maxAlternatives = 1
    
    recognition.onresult = (event: any) => {
      let finalTranscript = ""
      let interimTranscript = ""
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }
      
      if (finalTranscript) {
        const trimmed = finalTranscript.trim()
        if (trimmed) {
          const current = liveTranscriptRef.current
          // API sends cumulative results - e.g. "hello" then "hello world". Only append the NEW part.
          let toAppend = trimmed
          if (current) {
            if (trimmed.startsWith(current)) {
              toAppend = trimmed.slice(current.length).trim()
            } else if (current.endsWith(trimmed) || trimmed === lastFinalTranscriptRef.current) {
              toAppend = ""
            }
          }
          if (toAppend) {
            lastFinalTranscriptRef.current = trimmed
            liveTranscriptRef.current += (liveTranscriptRef.current ? " " : "") + toAppend
            setLiveTranscript(liveTranscriptRef.current.trim())
            console.log("[Speech] Final:", toAppend)
          }
        }
      } else if (interimTranscript) {
        setLiveTranscript((liveTranscriptRef.current + " " + interimTranscript).trim())
      }
    }
    
    recognition.onerror = (event: any) => {
      console.error("[Speech] Recognition error:", event.error)
    }
    
    recognition.onend = () => {
      console.log("[Speech] Recognition ended, isRecordingRef:", isRecordingRef.current)
      // Restart if still recording (speech recognition auto-stops after silence)
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          console.log("[Speech] Restarting recognition...")
          recognitionRef.current.start()
        } catch (e) {
          console.warn("[Speech] Could not restart:", e)
        }
      }
    }
    
    recognition.onstart = () => {
      console.log("[Speech] Recognition started successfully")
    }
    
    recognitionRef.current = recognition
    console.log("[Speech] Browser native recognition initialized")
    
    return () => {
      try {
        recognition.stop()
      } catch (_) {}
    }
  }, [])

  // Timer countdown
  useEffect(() => {
    if (hasStarted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [hasStarted, timeRemaining])

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleTimeUp = async () => {
    if (!isInterviewComplete) {
      await completeInterview()
    }
  }

  const startInterview = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push("/auth")
        return
      }
      
      if (balance !== null && balance < creditCost) {
        setError(`Not enough credits. This interview costs ${creditCost} credits.`)
        setIsLoading(false)
        return
      }
      
      let data: { interview: { id: string; question_count: number } } | null = null
      const preloadRaw = typeof window !== "undefined" ? sessionStorage.getItem("interview_preload") : null
      if (preloadRaw) {
        try {
          const preload = JSON.parse(preloadRaw)
          if (preload?.interviewType === interviewType && preload?.interview?.id) {
            sessionStorage.removeItem("interview_preload")
            data = { interview: preload.interview }
            if (preload.firstQuestion) {
              nextQuestionRef.current = { text: preload.firstQuestion, questionNum: 1 }
            }
          }
        } catch {
          /* ignore invalid preload */
        }
      }
      
      if (!data) {
        const response = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewType,
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.name || user.email?.split("@")[0],
            duration: selectedDuration,
            difficulty: selectedDifficulty,
            customScenario: customScenario || null,
            ...(urlRound && { round: urlRound }),
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to start interview")
        }
        
        data = await response.json()
        prefetchNextQuestion(data.interview.id, 1, [], user.id)
      } else if (!nextQuestionRef.current) {
        prefetchNextQuestion(data.interview.id, 1, [], user.id)
      }
      
      if (data.interview) {
        setInterviewId(data.interview.id)
        const qCount = data.interview.question_count || 5
        setTotalQuestions(qCount)
        setTimeRemaining(selectedDuration * 60)
        setHasStarted(true)
        setIsLoading(false)
        
        pendingIntroRef.current = { interviewId: data.interview.id, userId: user.id }
        
        if (interviewContext) {
          interviewContext.setInterviewStarted(true)
          interviewContext.setCreditsUsed(creditCost)
          interviewContext.setTotalQuestions(data.interview.question_count || 5)
          interviewContext.setInterviewId(data.interview.id)
        }
      }
    } catch (error) {
      console.error("Error starting interview:", error)
      setError(error instanceof Error ? error.message : "Failed to start interview")
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-fetch next question + TTS audio in background (so audio plays immediately)
  const prefetchNextQuestion = useCallback((
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
        ...(urlTopics.length > 0 && { topics: urlTopics }),
        ...(urlInterviewer && { interviewer: urlInterviewer }),
      }),
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error("Prefetch failed")))
      .then(async (data) => {
        if (!data?.question) return
        const text = data.question
        // Pre-fetch TTS audio so it plays immediately when question is shown
        try {
          const ttsRes = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voiceId }),
          })
          if (ttsRes.ok) {
            const ttsData = await ttsRes.json()
            if (ttsData.audioContent) {
              nextQuestionRef.current = { text, questionNum, audioBase64: ttsData.audioContent }
              return
            }
          }
        } catch { /* ignore TTS prefetch errors */ }
        nextQuestionRef.current = { text, questionNum }
      })
      .catch(() => { /* ignore prefetch errors */ })
  }, [interviewType, customScenario, totalQuestions, voiceId, urlTopics, urlInterviewer])

  const generateNextQuestion = async (
    interviewSessionId: string,
    questionNum: number,
    previousAnswers: Array<{ question: string; answer: string }>,
    userId: string
  ) => {
    setIsLoading(true)
    setIsProcessing(true)
    
    // Pre-fetch next question IMMEDIATELY (while user will answer this one) - makes next Q feel instantaneous
    if (questionNum < totalQuestions) {
      prefetchNextQuestion(interviewSessionId, questionNum + 1, previousAnswers, userId)
    }
    
    try {
      let questionText: string | null = null
      let preFetchedAudio: string | undefined

      // Use pre-fetched question (and audio if available) if ready
      if (nextQuestionRef.current?.questionNum === questionNum) {
        questionText = nextQuestionRef.current.text
        preFetchedAudio = nextQuestionRef.current.audioBase64
        nextQuestionRef.current = null
      }
      
      if (!questionText) {
        const response = await fetch("/api/interview/question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId: interviewSessionId,
            interviewType,
            questionNumber: questionNum,
            previousAnswers,
            userId,
            customScenario: customScenario || null,
            ...(urlTopics.length > 0 && { topics: urlTopics }),
            ...(urlInterviewer && { interviewer: urlInterviewer }),
          }),
        })
        if (!response.ok) throw new Error("Failed to generate question")
        const data = await response.json()
        questionText = data.question
      }
      
      if (questionText) {
        setCurrentQuestion(questionText)
        setIsProcessing(false)
        
        setTranscript(prev => [...prev, {
          type: "ai",
          content: questionText!,
          timestamp: new Date(),
          questionNumber: questionNum,
        }])
        
        // Pre-load TTS, play immediately (no artificial delay)
        const audioPromise = preFetchedAudio
          ? Promise.resolve(preFetchedAudio)
          : fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: questionText, voiceId }),
            })
              .then((r) => (r.ok ? r.json() : Promise.reject(new Error("TTS failed"))))
              .then((d) => d.audioContent as string)
              .catch(() => undefined)
        const [audio] = await Promise.all([audioPromise])
        await speakText(questionText, audio)
        avatarRef.current?.playIdle()
      }
    } catch (error) {
      console.error("Error generating question:", error)
      setError(error instanceof Error ? error.message : "Failed to generate question")
      setIsProcessing(false)
    } finally {
      setIsLoading(false)
    }
  }

  const startRecording = async () => {
    if (!userStream) return
    
    audioChunksRef.current = []
    videoChunksRef.current = []
    setRecordingTime(0)
    
    try {
      const hasVideo = userStream.getVideoTracks().length > 0
      const hasAudio = userStream.getAudioTracks().length > 0
      if (!hasAudio) {
        console.warn("[Recording] No audio track in stream - microphone may be denied or unavailable")
      }
      const streamToRecord = hasVideo ? userStream : new MediaStream(userStream.getAudioTracks())
      // Use explicit codecs (vp9/opus) so audio is included - plain "video/webm" can drop audio in some browsers
      let mimeType: string | undefined
      if (hasVideo) {
        mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
          ? "video/webm;codecs=vp8,opus"
          : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : undefined
      } else {
        mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : undefined
      }
      const mediaRecorder = new MediaRecorder(streamToRecord, mimeType ? { mimeType } : {})
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          if (hasVideo) {
            videoChunksRef.current.push(event.data)
          } else {
            audioChunksRef.current.push(event.data)
          }
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250)
      setIsRecording(true)
      isRecordingRef.current = true
      
      // Start browser native speech recognition for real-time transcription
      liveTranscriptRef.current = ""
      lastFinalTranscriptRef.current = ""
      setLiveTranscript("")
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start()
          console.log("[Speech] Started browser native recognition")
        } else {
          console.warn("[Speech] Recognition not initialized")
        }
      } catch (e) {
        console.warn("[Speech] Could not start recognition:", e)
      }
      
      avatarRef.current?.playIdle()
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = async (interviewIdToSave: string | null, questionNum: number) => {
    if (!mediaRecorderRef.current || !isRecording) return new Blob([])
    
    return new Promise<Blob>((resolve) => {
      mediaRecorderRef.current!.onstop = async () => {
        const hasVideo = videoChunksRef.current.length > 0
        const chunks = hasVideo ? videoChunksRef.current : audioChunksRef.current
        const blob = new Blob(chunks, { type: hasVideo ? "video/webm" : "audio/webm" })
        // Save both video and audio recordings (previously only saved when hasVideo)
        if (interviewIdToSave && chunks.length > 0) {
          try {
            await saveQuestionVideo(interviewIdToSave, questionNum, blob)
          } catch (e) {
            console.warn("Failed to save question recording:", e)
          }
        }
        resolve(blob)
      }
      
      // Flush buffered data before stop - ensures all audio is captured (fixes silent recordings)
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.requestData()
        }
      } catch (_) {}
      mediaRecorderRef.current!.stop()
      setIsRecording(false)
    })
  }

  const handleStartAnswer = () => {
    if (isAISpeaking) return
    startRecording()
  }

  const handleEndAnswer = async () => {
    if (!isRecording) return
    
    // Mark as not recording first to prevent auto-restart
    isRecordingRef.current = false
    
    // Stop speech recognition to capture final words
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        console.log("[Speech] Stopped browser native recognition")
      }
    } catch (_) {}
    
    // Small delay to ensure final transcript is captured
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const questionNum = currentQuestionIndex + 1
    await stopRecording(interviewId, questionNum)
    
    // Use the browser native transcription
    const finalTranscript = liveTranscriptRef.current.trim() || "No speech detected"
    console.log("[Speech] Final transcript:", finalTranscript)
    await processUserResponse(finalTranscript)
  }

  const processUserResponse = async (transcript: string) => {
    if (!interviewId) return
    
    setIsProcessing(true)
    
    try {
      // Save response
      const saveResponse = await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          question: currentQuestion,
          answer: transcript,
          questionNumber: currentQuestionIndex + 1,
          skipped: false,
        }),
      })
      
      if (!saveResponse.ok) {
        throw new Error("Failed to save response")
      }
      
      // Add to transcript
      setTranscript(prev => [...prev, {
        type: "user",
        content: transcript,
        timestamp: new Date(),
      }])
      
      const newResponses = [...responses, { question: currentQuestion, answer: transcript }]
      setResponses(newResponses)
      
      // Update context
      if (interviewContext) {
        interviewContext.setQuestionsAnswered(currentQuestionIndex + 1)
      }
      
      if (currentQuestionIndex < totalQuestions - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await generateNextQuestion(interviewId, nextIndex + 1, newResponses, user.id)
        }
      } else {
        await completeInterview()
      }
    } catch (error) {
      console.error("Error processing response:", error)
      setError(error instanceof Error ? error.message : "Error saving response")
    } finally {
      setIsProcessing(false)
    }
  }

  const repeatQuestion = async () => {
    if (!currentQuestion || isAISpeaking || isRecording) return
    ttsAudioRef.current?.pause()
    window.speechSynthesis?.cancel()
    // Use cached TTS if available - instant playback, no API call
    const cached = currentQuestionAudioRef.current?.text === currentQuestion
      ? currentQuestionAudioRef.current.audioBase64
      : undefined
    await speakText(currentQuestion, cached)
  }

  const completeInterview = async () => {
    setIsInterviewComplete(true)
    window.speechSynthesis?.cancel()
    ttsAudioRef.current?.pause()
    avatarRef.current?.stopAll()
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop())
    }
    if (interviewId) {
      console.log("[v0] completeInterview: calling analyze API for interviewId:", interviewId)
      try {
        const analysisRes = await fetch("/api/interview/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            interviewId,
            questionsSkipped: responses.filter((r) => r.answer.includes("[SKIPPED]")).length,
          }),
        })
        console.log("[v0] completeInterview: analyze API status:", analysisRes.status)
        if (!analysisRes.ok) {
          const err = await analysisRes.json().catch(() => ({}))
          console.warn("[v0] Analyze failed, navigating anyway:", analysisRes.status, err)
        } else {
          console.log("[v0] completeInterview: analyze API succeeded")
        }
      } catch (err) {
        console.warn("[v0] Analyze error, navigating anyway:", err)
      }
      console.log("[v0] completeInterview: navigating to results page")
      router.push(`/results?interviewId=${interviewId}`)
    } else {
      console.warn("[v0] completeInterview: no interviewId, cannot navigate to results")
    }
  }

  const handleExitConfirm = () => {
    window.speechSynthesis?.cancel()
    ttsAudioRef.current?.pause()
    avatarRef.current?.stopAll()
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop())
    }
    if (interviewId) {
      completeInterview()
    } else {
      router.push("/dashboard")
    }
  }

  const getInterviewTitle = () => {
    if (courseTitle) return courseTitle
    const titles: Record<string, string> = {
      technical: "Technical Interview",
      hr: "HR Interview",
      custom: "Custom Interview",
    }
    return titles[interviewType] || "Interview"
  }

  // Listen for global stop event (e.g. from navbar exit) to stop audio
  useEffect(() => {
    const handler = () => {
      window.speechSynthesis?.cancel()
      ttsAudioRef.current?.pause()
      avatarRef.current?.stopAll()
    }
    window.addEventListener("app:stop-voice-agent", handler)
    return () => window.removeEventListener("app:stop-voice-agent", handler)
  }, [])

  // Auto-start interview when component mounts (settings come from URL params)
  useEffect(() => {
    if (!hasStarted && !isLoading) {
      startInterview()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Play intro video and first question AFTER main UI is rendered and tour is done (new users must complete tour first)
  useEffect(() => {
    if (!hasStarted || !pendingIntroRef.current || !tourComplete) return

    const pending = pendingIntroRef.current
    pendingIntroRef.current = null // Clear so we only run once

    const runIntroAndFirstQuestion = async () => {
      // Brief delay to ensure AvatarVideoPlayer is mounted and ready
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      
      // 1. Q1 already pre-fetched in startInterview - ready when intro ends
      // 2. Play intro video (avatar introduces itself with audio)
      await avatarRef.current?.playIntro()
      
      // 3. Brief pause after intro before first question (0.5 sec)
      await new Promise(r => setTimeout(r, 500))
      
      // 4. First question is likely cached now - display and speak
      await generateNextQuestion(pending.interviewId, 1, [], pending.userId)
    }

    runIntroAndFirstQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, tourComplete])

  // Render main layout immediately (no separate loading screen or blur overlay).
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 relative">
      {error && !hasStarted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-md p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {/* Main Interview Layout */}
      <div className="flex h-screen">
        {/* Left Side - Avatar Video */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Avatar Video Container */}
          <div className="relative flex-1 rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
            <AvatarVideoPlayer
              ref={avatarRef}
              avatarId={urlInterviewer}
              className="w-full h-full"
            />
            
            {/* Timer Overlay */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white font-mono text-lg">
              {formatTime(timeRemaining)}
            </div>
            
            {/* Start/End Answer Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2" data-tour="tour-start-answer">
              {!isRecording ? (
                <button
                  onClick={handleStartAnswer}
                  disabled={isAISpeaking || isProcessing}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mic className="w-5 h-5" />
                  START ANSWER
                </button>
              ) : (
                <button
                  onClick={handleEndAnswer}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 transition-all animate-pulse"
                >
                  <div className="w-3 h-3 bg-white rounded-sm" />
                  END ANSWER
                </button>
              )}
            </div>
            
            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Recording {formatTime(recordingTime)}
              </div>
            )}
          </div>
          
          {/* Question Display */}
          <div className="mt-4 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">Main Question</span>
              <button
                onClick={repeatQuestion}
                disabled={isAISpeaking || isRecording}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Repeat Question
              </button>
            </div>
            <p className="text-lg text-gray-900 font-medium">
              {isProcessing ? "Generating question..." : currentQuestion || "Waiting for question..."}
            </p>
            
            {/* Listening Indicator with Live Transcript */}
            {isRecording && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span className="font-medium">Listening...</span>
                </div>
                {liveTranscript && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 max-h-24 overflow-y-auto">
                    {liveTranscript}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side - User Video & Controls */}
        <div className="w-80 p-6 flex flex-col gap-4">
          {/* User Video */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-900 aspect-video" data-tour="tour-settings">
            <button
              onClick={() => setShowMediaSettings(true)}
              className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              title="Change camera and microphone"
            >
              <Settings className="w-5 h-5" />
            </button>
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
            {!userStream && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <Video className="w-8 h-8 opacity-50" />
              </div>
            )}
          </div>
          
          {/* Interview Info Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <h3 className="text-lg font-semibold mb-1">{getInterviewTitle()}</h3>
            <p className="text-blue-200 text-sm capitalize">{selectedDifficulty}</p>
          </div>
          
          {/* Action Buttons */}
          <button
            onClick={() => setShowEvaluationCriteria(true)}
            data-tour="tour-evaluation-criteria"
            className="w-full py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Info className="w-5 h-5" />
            EVALUATION CRITERIA
          </button>
          
          <button
            onClick={() => setShowExitDialog(true)}
            className="w-full py-3 bg-white border border-red-200 rounded-xl font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            EXIT INTERVIEW
          </button>
        </div>
      </div>
      
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
        }}
      />
      {/* Exit Dialog */}
      <ExitInterviewDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onConfirm={handleExitConfirm}
        isInterviewStarted={hasStarted}
        creditsUsed={creditCost}
        questionsAnswered={currentQuestionIndex}
        totalQuestions={totalQuestions}
      />
    </div>
  )
}
