"use client"

import { useEffect, useRef } from "react"

interface AudioRecorderProps {
  isListening: boolean
}

export default function AudioRecorder({ isListening }: AudioRecorderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!isListening) return

    const setupAudioVisualizer = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)

        source.connect(analyser)
        analyserRef.current = analyser

        const dataArray = new Uint8Array(analyser.frequencyBinCount)
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const draw = () => {
          animationRef.current = requestAnimationFrame(draw)
          analyser.getByteFrequencyData(dataArray)

          ctx.fillStyle = "rgb(240, 244, 248)"
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          const barWidth = (canvas.width / dataArray.length) * 2.5
          let x = 0

          for (let i = 0; i < dataArray.length; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height

            const hue = (i / dataArray.length) * 240
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)

            x += barWidth + 1
          }
        }

        draw()

        return () => {
          stream.getTracks().forEach((track) => track.stop())
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
          }
        }
      } catch (err) {
        console.log("[v0] Microphone error:", err)
      }
    }

    const cleanup = setupAudioVisualizer()
    return () => {
      cleanup?.then((fn) => fn?.())
    }
  }, [isListening])

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <div className="w-full h-24 bg-white rounded-lg border border-gray-200 overflow-hidden">
        <canvas ref={canvasRef} width={300} height={100} className="w-full h-full" />
      </div>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
          isListening ? "bg-red-600 animate-pulse" : "bg-blue-600"
        }`}
      >
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 16.91c-1.48 1.46-3.51 2.36-5.7 2.36-2.2 0-4.2-.9-5.7-2.36M19 12h2c0 .64-.09 1.28-.29 1.9M5 12H3c0-.64.09-1.28.29-1.9" />
        </svg>
      </div>
    </div>
  )
}
