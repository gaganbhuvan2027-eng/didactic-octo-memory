"use client"

import { useState, useCallback, useRef, useEffect } from "react"

export interface LipSyncData {
  mouthOpenness: number // 0-1, how open the mouth is
  mouthShape: "closed" | "narrow" | "medium" | "wide" | "round" // mouth shape for different phonemes
}

export function useTextToSpeech(options?: { rate?: number; delayBeforePlayMs?: number }) {
  const speechRate = options?.rate ?? 0.95
  const delayBeforePlayMs = options?.delayBeforePlayMs ?? 0

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [lipSyncData, setLipSyncData] = useState<LipSyncData>({
    mouthOpenness: 0,
    mouthShape: "closed",
  })
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const workerReady = useRef(false)
  const speakStartTimeRef = useRef<number>(0)
  const delayBeforePlayMsRef = useRef(delayBeforePlayMs)
  delayBeforePlayMsRef.current = delayBeforePlayMs

  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Initialize Web Worker for TTS
    if (!workerRef.current) {
      workerRef.current = new Worker("/workers/ttsWorker.js")
      workerRef.current.onmessage = (event) => {
        if (event.data.type === "READY") {
          workerReady.current = true
          console.log("[useTTS] TTS Worker is ready.")
        } else if (event.data.type === "ERROR") {
          console.error("[useTTS] TTS Worker error:", event.data.error)
          // Fallback to browser TTS if worker fails
          // This is handled in the speak function now
        } else if (event.data.type === "AUDIO_CHUNK") {
          const buf = event.data.audioBuffer
          const delayMs = delayBeforePlayMsRef.current
          if (delayMs > 0) {
            const elapsed = Date.now() - (speakStartTimeRef.current || Date.now())
            const waitMs = Math.max(0, delayMs - elapsed)
            setTimeout(() => playAudioBuffer(buf), waitMs)
          } else {
            playAudioBuffer(buf)
          }
        }
      }
      workerRef.current.postMessage({ type: "INIT" })
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  const playAudioBuffer = useCallback(async (float32Array: Float32Array) => {
    if (!audioContextRef.current) return

    const audioBuffer = audioContextRef.current.createBuffer(
      1, // mono
      float32Array.length,
      16000, // sample rate from worker
    )
    audioBuffer.copyToChannel(float32Array, 0)

    const source = audioContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioContextRef.current.destination)

    source.onended = () => {
      setIsSpeaking(false)
      setLipSyncData({ mouthOpenness: 0, mouthShape: "closed" })
    }

    setIsSpeaking(true)
    source.start()

    // Animate lip sync for the duration of the audio buffer
    animateLipSync("", float32Array.length / 16000 * 1000) // Placeholder text, duration in ms
  }, [])

  const analyzeMouthShape = (char: string): LipSyncData["mouthShape"] => {
    const lower = char.toLowerCase()

    // Vowels and their mouth shapes
    if (["a", "á", "à"].includes(lower)) return "wide"
    if (["e", "é", "è"].includes(lower)) return "medium"
    if (["i", "í", "ì"].includes(lower)) return "narrow"
    if (["o", "ó", "ò", "u", "ú", "ù"].includes(lower)) return "round"

    // Consonants that require mouth opening
    if (["m", "b", "p"].includes(lower)) return "closed"
    if (["f", "v"].includes(lower)) return "narrow"

    return "medium"
  }

  const animateLipSync = (text: string, duration: number) => {
    let charIndex = 0
    const chars = text.split("")
    const charDuration = duration / chars.length

    const animate = () => {
      if (charIndex >= chars.length) {
        setLipSyncData({ mouthOpenness: 0, mouthShape: "closed" })
        return
      }

      const char = chars[charIndex]
      const mouthShape = analyzeMouthShape(char)

      // Calculate openness based on character type
      let mouthOpenness = 0
      if (char === " ") {
        mouthOpenness = 0.1
      } else if (/[aeiouáéíóú]/i.test(char)) {
        mouthOpenness = 0.6 + Math.random() * 0.3 // 0.6-0.9 for vowels
      } else if (/[bcdfghjklmnpqrstvwxyz]/i.test(char)) {
        mouthOpenness = 0.3 + Math.random() * 0.2 // 0.3-0.5 for consonants
      }

      setLipSyncData({ mouthOpenness, mouthShape })

      charIndex++
      animationRef.current = setTimeout(animate, charDuration)
    }

    animate()
  }

  const speakWithBrowserTTS = async (text: string, delayMs = 0): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (!window.speechSynthesis) {
          console.warn("[v0] Speech synthesis not supported")
          resolve()
          return
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        utterance.rate = speechRate; // Apply the configurable speech rate
        utterance.pitch = 1.05 // Slightly higher pitch for clarity
        utterance.volume = 1.0

        // Estimate duration for lip sync
        const estimatedDuration = text.length * 80

        utterance.onstart = () => {
          setIsSpeaking(true)
          animateLipSync(text, estimatedDuration)
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          setLipSyncData({ mouthOpenness: 0, mouthShape: "closed" })
          resolve()
        }

        utterance.onerror = (event) => {
          if (event.error === "interrupted" || event.error === "canceled") {
            console.log("[v0] Speech interrupted/canceled (expected)")
          } else {
            console.warn("[v0] Browser TTS error (non-critical):", event.error)
          }
          setIsSpeaking(false)
          setLipSyncData({ mouthOpenness: 0, mouthShape: "closed" })
          resolve()
        }

        setTimeout(() => {
          const voices = window.speechSynthesis.getVoices()
          const preferredVoice =
            // Priority 1: Google voices (most natural)
            voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google") && v.name.includes("US")) ||
            voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
            // Priority 2: Microsoft voices
            voices.find((v) => v.lang.startsWith("en") && v.name.includes("Microsoft") && v.name.includes("Natural")) ||
            voices.find((v) => v.lang.startsWith("en") && v.name.includes("Microsoft")) ||
            // Priority 3: Cloud voices (non-local)
            voices.find((v) => v.lang.startsWith("en") && !v.localService) ||
            // Priority 4: Any English voice
            voices.find((v) => v.lang.startsWith("en"))

          if (preferredVoice) {
            utterance.voice = preferredVoice
          }

          window.speechSynthesis.speak(utterance)
        }, Math.max(50, delayMs))
      } catch (error) {
        console.warn("[v0] Browser TTS exception (non-critical):", error)
        setIsSpeaking(false)
        setLipSyncData({ mouthOpenness: 0, mouthShape: "closed" })
        resolve()
      }
    })
  }

  const speak = useCallback(async (text: string): Promise<void> => {
    return new Promise(async (resolve) => {
      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current)
        animationRef.current = null
      }

      if (workerRef.current && workerReady.current) {
        // Use Web Worker for TTS - pre-load starts immediately
        speakStartTimeRef.current = Date.now()
        workerRef.current.postMessage({ type: "SPEAK", text })
        // Resolve immediately as audio will be played via onmessage callback
        resolve()
      } else {
        console.warn("[useTTS] TTS Worker not ready, falling back to browser TTS")
        await speakWithBrowserTTS(text, delayBeforePlayMs)
        resolve()
      }
    })
  }, [playAudioBuffer, speakWithBrowserTTS, delayBeforePlayMs])

  return { speak, isSpeaking, lipSyncData }
}
