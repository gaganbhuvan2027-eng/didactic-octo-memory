"use client"

import { useState, useCallback, useRef } from "react"

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false)
  const recognitionRef = useRef<any>(null)
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isListeningRef = useRef(false)
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isStartingRef = useRef(false)

  const SpeechRecognition =
    typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null

  const resetTranscript = useCallback(() => {
    console.log("[v0] Resetting transcript")
    setTranscript("")
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      console.log("[v0] Speech Recognition not supported")
      alert("Speech Recognition is not supported in your browser. Please use Chrome, Edge, or Safari.")
      return
    }

    console.log("[v0] Starting speech recognition...")
    setTranscript("")
    startRecognition()
  }, [SpeechRecognition])

  const startRecognition = useCallback(() => {
    if (!SpeechRecognition) return

    if (isStartingRef.current) {
      console.log("[v0] Recognition already starting, skipping")
      return
    }

    try {
      isStartingRef.current = true

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current = null
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      setTimeout(() => {
        try {
          const recognition = new SpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = "en-US"
          recognition.maxAlternatives = 1

          recognitionRef.current = recognition

          recognition.onstart = () => {
            console.log("[v0] Speech recognition started")
            setIsListening(true)
            isListeningRef.current = true
            isStartingRef.current = false
          }

          recognition.onresult = (event: any) => {
            console.log("[v0] Speech detected")
            setIsDetectingSpeech(true)

            if (speechTimeoutRef.current) {
              clearTimeout(speechTimeoutRef.current)
            }

            speechTimeoutRef.current = setTimeout(() => {
              setIsDetectingSpeech(false)
            }, 200)

            let interimTranscript = ""
            let finalTranscript = ""

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcriptSegment = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += transcriptSegment + " "
              } else {
                interimTranscript += transcriptSegment
              }
            }

            if (finalTranscript) {
              setTranscript((prev) => prev + finalTranscript)
              console.log("[v0] Final transcript:", finalTranscript)
            } else if (interimTranscript) {
              setTranscript((prev) => {
                const words = prev.split(" ")
                words[words.length - 1] = interimTranscript
                return words.join(" ")
              })
            }
          }

          recognition.onerror = (event: any) => {
            console.log("[v0] Speech recognition error:", event.error)
            isStartingRef.current = false

            if (event.error === "aborted") {
              console.log("[v0] Recognition aborted, will restart if needed")
              return
            }

            if (event.error === "no-speech") {
              console.log("[v0] No speech detected, continuing to listen...")
            } else if (event.error === "audio-capture") {
              console.error("[v0] No microphone detected")
              alert("No microphone detected. Please check your microphone connection and refresh the page.")
              setIsListening(false)
              isListeningRef.current = false
            } else if (event.error === "not-allowed") {
              console.error("[v0] Microphone permission denied")
              alert("Microphone permission denied. Please allow microphone access and refresh the page.")
              setIsListening(false)
              isListeningRef.current = false
            } else {
              console.error("[v0] Speech recognition error:", event.error)
            }
          }

          recognition.onend = () => {
            console.log("[v0] Speech recognition ended")
            setIsDetectingSpeech(false)
            isStartingRef.current = false

            if (isListeningRef.current && recognitionRef.current) {
              console.log("[v0] Auto-restarting speech recognition...")
              restartTimeoutRef.current = setTimeout(() => {
                try {
                  if (isListeningRef.current && !isStartingRef.current) {
                    startRecognition()
                    console.log("[v0] Recognition restarted successfully")
                  }
                } catch (error) {
                  console.log("[v0] Error restarting recognition:", error)
                  isStartingRef.current = false
                  setIsListening(false)
                  isListeningRef.current = false
                }
              }, 300)
            } else {
              setIsListening(false)
              isListeningRef.current = false
            }
          }

          recognition.start()
          console.log("[v0] Recognition start called")
        } catch (error) {
          console.log("[v0] Error starting speech recognition:", error)
          isStartingRef.current = false
          setIsListening(false)
          isListeningRef.current = false
        }
      }, 100)
    } catch (error) {
      console.log("[v0] Error in startRecognition:", error)
      isStartingRef.current = false
      setIsListening(false)
      isListeningRef.current = false
    }
  }, [SpeechRecognition])

  const stopListening = useCallback(() => {
    console.log("[v0] Stopping speech recognition")

    isStartingRef.current = false
    isListeningRef.current = false
    setIsDetectingSpeech(false)

    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current)
      restartTimeoutRef.current = null
    }

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
      speechTimeoutRef.current = null
    }

    setIsListening(false)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
      } catch (error) {
        console.log("[v0] Error stopping speech recognition:", error)
      }
    }
  }, [])

  return { startListening, stopListening, transcript, isListening, isDetectingSpeech, resetTranscript }
}
