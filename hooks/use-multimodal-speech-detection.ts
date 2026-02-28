"use client"

import { useEffect, useRef, useState, useCallback } from "react"

async function transcribeAudioWithGroq(audioBlob: Blob): Promise<string | null> {
  console.log("[Groq STT] Starting transcription with Whisper Large v3 Turbo...")
  console.log("[Groq STT] Audio blob size:", audioBlob.size, "bytes")

  const formData = new FormData()
  formData.append("file", audioBlob, "audio.webm")

  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      console.log("[Groq STT] Transcription successful:", data.text)
      return data.text || null
    } else {
      console.error(`[Groq STT] Error: ${response.status} - ${response.statusText}`)
      const errorData = await response.json()
      console.error("[Groq STT] Error details:", errorData)
      return null
    }
  } catch (error) {
    console.error("[Groq STT] Network error during transcription:", error)
    return null
  }
}

interface MultimodalSpeechDetectionOptions {
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  onTranscription?: (text: string) => void
  audioThreshold?: number
  silenceDuration?: number
  motionThreshold?: number
}

export function useMultimodalSpeechDetection({
  onSpeechStart,
  onSpeechEnd,
  onTranscription,
  audioThreshold = 25,
  silenceDuration = 2500,
  motionThreshold = 5,
}: MultimodalSpeechDetectionOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [transcription, setTranscription] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previousFrameRef = useRef<ImageData | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const shouldDetectRef = useRef(false)
  const lastSpeechEndRef = useRef<number>(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const detectMotion = useCallback((currentFrame: ImageData, previousFrame: ImageData): number => {
    // Focus on mouth region (bottom third of face)
    const width = currentFrame.width
    const height = currentFrame.height
    const mouthRegionStart = Math.floor(height * 0.6) // Bottom 40% of frame

    let totalDiff = 0
    let pixelCount = 0

    for (let y = mouthRegionStart; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i])
        const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1])
        const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2])
        totalDiff += (rDiff + gDiff + bDiff) / 3
        pixelCount++
      }
    }

    return totalDiff / pixelCount
  }, [])

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      console.error("[Groq STT] No stream available for recording")
      return
    }

    try {
      // Create a new MediaRecorder for this speech segment
      const options = { mimeType: "audio/webm" }
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onerror = (event) => {
        console.error("[Groq STT] MediaRecorder error:", event)
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log("[Groq STT] Recording stopped, processing audio...")
        
        if (audioChunksRef.current.length === 0) {
          console.warn("[Groq STT] No audio data captured")
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        
        // Only transcribe if we have meaningful audio (> 1KB)
        if (audioBlob.size > 1000) {
          setIsTranscribing(true)
          const transcribedText = await transcribeAudioWithGroq(audioBlob)
          setIsTranscribing(false)
          
          if (transcribedText) {
            setTranscription(transcribedText)
            onTranscription?.(transcribedText)
          }
        } else {
          console.warn("[Groq STT] Audio too short to transcribe")
        }
        
        audioChunksRef.current = []
      }

      // Start recording with 100ms timeslices for better chunk management
      mediaRecorderRef.current.start(100)
      console.log("[Groq STT] Recording started")
    } catch (error) {
      console.error("[Groq STT] Error starting recording:", error)
    }
  }, [onTranscription])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop()
        console.log("[Groq STT] Recording stop requested")
      } catch (error) {
        console.error("[Groq STT] Error stopping recording:", error)
      }
    }
  }, [])

  const detectSpeech = useCallback(() => {
    if (!shouldDetectRef.current || !analyserRef.current || !canvasRef.current || !videoRef.current) {
      return
    }

    // Audio analysis
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const audioActive = average > audioThreshold

    // Video analysis (lip movement detection)
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d", { willReadFrequently: true })

    let visualActive = false
    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height)

      if (previousFrameRef.current) {
        const motion = detectMotion(currentFrame, previousFrameRef.current)
        visualActive = motion > motionThreshold
      }

      previousFrameRef.current = currentFrame
    }

    // Combined detection: both audio AND visual cues
    const isSpeakingNow = audioActive && visualActive

    if (isSpeakingNow) {
      // Clear silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }

      // Trigger speech start if not already speaking
      if (!isSpeaking) {
        const now = Date.now()
        // Debounce: only trigger if it's been at least 1 second since last speech end
        if (now - lastSpeechEndRef.current > 1000) {
          console.log("[v0] Multimodal: User started speaking (audio + visual)")
          setIsSpeaking(true)
          setTranscription(null) // Clear previous transcription
          startRecording()
          onSpeechStart?.()
        }
      }
    } else if (isSpeaking) {
      // Start silence timer if not already started
      if (!silenceTimerRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          console.log("[v0] Multimodal: User stopped speaking (silence detected)")
          setIsSpeaking(false)
          lastSpeechEndRef.current = Date.now()
          stopRecording()
          onSpeechEnd?.()
          silenceTimerRef.current = null
        }, silenceDuration)
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectSpeech)
  }, [isSpeaking, audioThreshold, silenceDuration, motionThreshold, onSpeechStart, onSpeechEnd, detectMotion, startRecording, stopRecording])

  const startDetection = useCallback(
    async (stream: MediaStream, videoElement: HTMLVideoElement) => {
      try {
        console.log("[v0] Starting multimodal speech detection...")

        // Store stream reference for MediaRecorder
        streamRef.current = stream

        // Setup audio analysis with gain control
        audioContextRef.current = new AudioContext()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        
        // Add gain node for volume normalization
        const gainNode = audioContextRef.current.createGain()
        gainNode.gain.value = 1.0
        
        analyserRef.current.fftSize = 2048
        analyserRef.current.smoothingTimeConstant = 0.8
        
        // Connect with gain node
        source.connect(gainNode)
        gainNode.connect(analyserRef.current)

        // Setup video analysis
        videoRef.current = videoElement
        canvasRef.current = document.createElement("canvas")
        canvasRef.current.width = 320
        canvasRef.current.height = 240

        shouldDetectRef.current = true
        setIsDetecting(true)
        detectSpeech()

        console.log("[v0] Multimodal detection started successfully")
        console.log("[Groq STT] Ready to transcribe with Whisper Large v3 Turbo")
      } catch (error) {
        console.error("[v0] Error starting multimodal detection:", error)
      }
    },
    [detectSpeech],
  )

  const stopDetection = useCallback(() => {
    console.log("[v0] Stopping multimodal detection...")
    shouldDetectRef.current = false
    setIsDetecting(false)
    setIsSpeaking(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop()
      } catch (error) {
        console.error("[Groq STT] Error stopping MediaRecorder:", error)
      }
      mediaRecorderRef.current = null
    }

    audioChunksRef.current = []
    streamRef.current = null
    analyserRef.current = null
    videoRef.current = null
    canvasRef.current = null
    previousFrameRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [stopDetection])

  return {
    isSpeaking,
    isDetecting,
    isTranscribing,
    startDetection,
    stopDetection,
    transcription,
  }
}
