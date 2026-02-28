"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { VoiceActivityDetector } from "@/lib/audio/vad"
import { StreamingAudioPlayer } from "@/lib/audio/playback"

interface StreamingInterviewState {
  isConnected: boolean
  isListening: boolean
  isSpeaking: boolean
  userTranscript: string
  aiTranscript: string
  currentQuestion: string
  error: string | null
}

export function useStreamingInterview(interviewId: string) {
  const [state, setState] = useState<StreamingInterviewState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    userTranscript: "",
    aiTranscript: "",
    currentQuestion: "",
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const vadRef = useRef<VoiceActivityDetector | null>(null)
  const playerRef = useRef<StreamingAudioPlayer | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)

  const connect = useCallback(async () => {
    try {
      console.log("[v0] Connecting to streaming interview...")

      // Initialize Web Worker
      workerRef.current = new Worker("/workers/audio-processor.js")
      workerRef.current.postMessage({ type: "init" })

      // Initialize audio player
      playerRef.current = new StreamingAudioPlayer()

      // Initialize VAD
      vadRef.current = new VoiceActivityDetector(30, 1500)

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      mediaStreamRef.current = stream

      // Initialize VAD with stream
      await vadRef.current.initialize(stream)

      // Setup audio processing
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1)

      // Connect WebSocket
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//${window.location.host}/api/interview/stream?interviewId=${interviewId}`

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log("[v0] WebSocket connected")
        setState((prev) => ({ ...prev, isConnected: true, error: null }))
      }

      wsRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data)
        handleServerMessage(message)
      }

      wsRef.current.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
        setState((prev) => ({ ...prev, error: "Connection error" }))
      }

      wsRef.current.onclose = () => {
        console.log("[v0] WebSocket closed")
        setState((prev) => ({ ...prev, isConnected: false }))
      }

      // Process audio chunks
      processorRef.current.onaudioprocess = (e) => {
        if (!state.isListening || !vadRef.current) return

        const inputData = e.inputBuffer.getChannelData(0)

        // Check VAD
        const isSpeaking = vadRef.current.isSpeaking()

        if (isSpeaking) {
          // Send audio chunk to worker for processing
          workerRef.current?.postMessage({
            type: "process",
            data: inputData,
          })
        } else if (vadRef.current.hasBeenSilent()) {
          // User stopped speaking
          stopListening()
        }
      }

      source.connect(processorRef.current)
      processorRef.current.connect(audioContextRef.current.destination)

      // Handle worker messages
      workerRef.current.onmessage = (e) => {
        const { type, data } = e.data

        if (type === "chunk" && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send audio chunk to server
          wsRef.current.send(data)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to connect:", error)
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to connect",
      }))
    }
  }, [interviewId])

  const handleServerMessage = useCallback((message: any) => {
    console.log("[v0] Server message:", message.type)

    switch (message.type) {
      case "question":
        setState((prev) => ({
          ...prev,
          currentQuestion: message.question,
          aiTranscript: message.question,
        }))
        break

      case "transcript":
        // Partial STT result
        setState((prev) => ({
          ...prev,
          userTranscript: message.text,
        }))
        break

      case "audio_chunk":
        // TTS audio chunk
        if (playerRef.current && message.data) {
          const pcmData = new Float32Array(message.data)
          playerRef.current.playChunk(pcmData)
          setState((prev) => ({ ...prev, isSpeaking: true }))
        }
        break

      case "audio_end":
        // AI finished speaking
        setState((prev) => ({ ...prev, isSpeaking: false }))
        // Auto-start listening after AI finishes
        setTimeout(() => startListening(), 500)
        break

      case "llm_token":
        // Streaming LLM token
        setState((prev) => ({
          ...prev,
          aiTranscript: prev.aiTranscript + message.token,
        }))
        break

      case "error":
        console.error("[v0] Server error:", message.error)
        setState((prev) => ({ ...prev, error: message.error }))
        break
    }
  }, [])

  const startListening = useCallback(() => {
    if (!state.isConnected) return

    console.log("[v0] Starting to listen...")
    setState((prev) => ({ ...prev, isListening: true, userTranscript: "" }))
    vadRef.current?.reset()

    // Send start listening message
    wsRef.current?.send(JSON.stringify({ type: "start_listening" }))
  }, [state.isConnected])

  const stopListening = useCallback(() => {
    console.log("[v0] Stopping listening...")
    setState((prev) => ({ ...prev, isListening: false }))

    // Send stop listening message
    wsRef.current?.send(JSON.stringify({ type: "stop_listening" }))
  }, [])

  const disconnect = useCallback(() => {
    console.log("[v0] Disconnecting...")

    // Stop audio playback
    playerRef.current?.destroy()
    playerRef.current = null

    // Stop VAD
    vadRef.current?.destroy()
    vadRef.current = null

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Stop worker
    workerRef.current?.terminate()
    workerRef.current = null

    // Close WebSocket
    wsRef.current?.close()
    wsRef.current = null

    setState({
      isConnected: false,
      isListening: false,
      isSpeaking: false,
      userTranscript: "",
      aiTranscript: "",
      currentQuestion: "",
      error: null,
    })
  }, [])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    ...state,
    connect,
    disconnect,
    startListening,
    stopListening,
  }
}
