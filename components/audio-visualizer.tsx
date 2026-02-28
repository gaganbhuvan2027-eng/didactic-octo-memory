"use client"

import { useEffect, useRef } from "react"

interface AudioVisualizerProps {
  isActive: boolean
  isDetectingSpeech?: boolean
}

export default function AudioVisualizer({ isActive, isDetectingSpeech = false }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const audioContextRef = useRef<AudioContext>()
  const analyserRef = useRef<AnalyserNode>()
  const dataArrayRef = useRef<Uint8Array>()
  const streamRef = useRef<MediaStream>()

  useEffect(() => {
    if (!isActive) {
      // Stop visualization
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close()
      }

      // Clear canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    // Start visualization
    const setupAudioVisualization = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const draw = () => {
          if (!isActive) return

          animationRef.current = requestAnimationFrame(draw)

          analyser.getByteFrequencyData(dataArray)

          ctx.fillStyle = "rgb(249, 250, 251)"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const barWidth = (canvas.width / bufferLength) * 2.5
          let barHeight
          let x = 0

          for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8

            // Create gradient for bars
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height)
            gradient.addColorStop(0, "rgb(59, 130, 246)")
            gradient.addColorStop(1, "rgb(37, 99, 235)")

            ctx.fillStyle = gradient
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

            x += barWidth + 1
          }
        }

        draw()
      } catch (error) {
        console.error("[v0] Error setting up audio visualization:", error)
      }
    }

    if (!isDetectingSpeech) {
      setupAudioVisualization()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close()
      }
    }
  }, [isActive, isDetectingSpeech])

  return (
    <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200 flex items-center justify-center">
      {isActive ? (
        <div className="flex items-center gap-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-blue-500 rounded-full transition-all duration-150 ${
                isDetectingSpeech ? "animate-pulse" : ""
              }`}
              style={{
                height: isDetectingSpeech ? `${Math.random() * 60 + 20}px` : "20px",
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-sm">Microphone inactive</div>
      )}
    </div>
  )
}
