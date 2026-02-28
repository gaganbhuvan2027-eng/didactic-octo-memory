"use client"

import { useEffect, useRef, useState } from "react"

interface UseVoiceActivityDetectionProps {
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  silenceThreshold?: number // milliseconds of silence before considering speech ended
  volumeThreshold?: number // 0-255, volume level to consider as speech
}

export function useVoiceActivityDetection({
  onSpeechStart,
  onSpeechEnd,
  silenceThreshold = 3000, // Increased to 3 seconds to give speech recognition time to finalize
  volumeThreshold = 25, // Increased threshold to reduce false positives from ambient noise
}: UseVoiceActivityDetectionProps = {}) {
  const [isActive, setIsActive] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const wasSpeakingRef = useRef(false)
  const shouldDetectRef = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      
      // Add gain node for volume control
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 1.0
      
      source.connect(gainNode)
      gainNode.connect(analyser)

      shouldDetectRef.current = true
      setIsActive(true)
      detectVoiceActivity()
    } catch (error) {
      console.error("[v0] Error starting VAD:", error)
    }
  }

  const detectVoiceActivity = () => {
    if (!analyserRef.current) return

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const checkAudio = () => {
      if (!shouldDetectRef.current) {
        return
      }

      analyser.getByteFrequencyData(dataArray)

      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

      const isSpeakingNow = average > volumeThreshold

      if (isSpeakingNow) {
        // Clear silence timer if speaking
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = null
        }

        // Trigger speech start if wasn't speaking before
        if (!wasSpeakingRef.current) {
          console.log("[v0] Speech detected, volume:", average)
          setIsSpeaking(true)
          wasSpeakingRef.current = true
          onSpeechStart?.()
        }
      } else if (wasSpeakingRef.current) {
        // Start silence timer if was speaking but now silent
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (!shouldDetectRef.current) return

            console.log("[v0] Silence detected, ending speech")
            setIsSpeaking(false)
            wasSpeakingRef.current = false

            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current)
            }

            debounceTimerRef.current = setTimeout(() => {
              onSpeechEnd?.()
            }, 500) // 500ms debounce
          }, silenceThreshold)
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio)
    }

    checkAudio()
  }

  const stopDetection = () => {
    shouldDetectRef.current = false

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setIsActive(false)
    setIsSpeaking(false)
    wasSpeakingRef.current = false
  }

  useEffect(() => {
    return () => {
      stopDetection()
    }
  }, [])

  return {
    isActive,
    isSpeaking,
    startDetection,
    stopDetection,
  }
}
