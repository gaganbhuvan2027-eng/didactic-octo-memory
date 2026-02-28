"use client"

import { useEffect, useRef } from "react"

interface AudioReactiveOrbProps {
  audioLevel: number
  isActive: boolean
  isSpeaking: boolean
}

export default function AudioReactiveOrb({ audioLevel, isActive, isSpeaking }: AudioReactiveOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2

    let phase = 0

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Calculate normalized audio level (0-1)
      const normalizedLevel = Math.min(audioLevel / 100, 1)

      // Base size and reactivity
      const baseRadius = 40
      const maxExpansion = isSpeaking ? 25 : 10
      const expansion = normalizedLevel * maxExpansion
      const radius = baseRadius + expansion

      // Create gradient based on state
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5)

      if (isActive) {
        if (isSpeaking) {
          // Green when speaking
          gradient.addColorStop(0, `rgba(34, 197, 94, ${0.9 + normalizedLevel * 0.1})`)
          gradient.addColorStop(0.5, `rgba(34, 197, 94, ${0.6 + normalizedLevel * 0.2})`)
          gradient.addColorStop(1, `rgba(34, 197, 94, 0)`)
        } else {
          // Blue when listening
          gradient.addColorStop(0, `rgba(59, 130, 246, ${0.8 + normalizedLevel * 0.2})`)
          gradient.addColorStop(0.5, `rgba(59, 130, 246, ${0.5 + normalizedLevel * 0.2})`)
          gradient.addColorStop(1, `rgba(59, 130, 246, 0)`)
        }
      } else {
        // Gray when idle
        gradient.addColorStop(0, "rgba(156, 163, 175, 0.6)")
        gradient.addColorStop(0.5, "rgba(156, 163, 175, 0.3)")
        gradient.addColorStop(1, "rgba(156, 163, 175, 0)")
      }

      // Draw outer glow rings
      const numRings = 3
      for (let i = 0; i < numRings; i++) {
        const ringRadius = radius + (i + 1) * 15
        const ringOpacity = isActive ? (0.3 - i * 0.1) * (1 + normalizedLevel * 0.5) : 0.1

        ctx.beginPath()
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2)

        if (isActive && isSpeaking) {
          ctx.strokeStyle = `rgba(34, 197, 94, ${ringOpacity})`
        } else if (isActive) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${ringOpacity})`
        } else {
          ctx.strokeStyle = `rgba(156, 163, 175, ${ringOpacity})`
        }

        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw main orb with wave distortion
      ctx.beginPath()
      const numPoints = 64

      for (let i = 0; i <= numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2

        // Create wave distortion based on audio
        const waveFreq = 8
        const waveAmp = isActive ? normalizedLevel * 8 : 0
        const wave = Math.sin(angle * waveFreq + phase) * waveAmp

        const r = radius + wave
        const x = centerX + r * Math.cos(angle)
        const y = centerY + r * Math.sin(angle)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Inner glow
      const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.6)

      if (isActive && isSpeaking) {
        innerGradient.addColorStop(0, "rgba(255, 255, 255, 0.8)")
        innerGradient.addColorStop(1, "rgba(34, 197, 94, 0)")
      } else if (isActive) {
        innerGradient.addColorStop(0, "rgba(255, 255, 255, 0.6)")
        innerGradient.addColorStop(1, "rgba(59, 130, 246, 0)")
      } else {
        innerGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)")
        innerGradient.addColorStop(1, "rgba(156, 163, 175, 0)")
      }

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = innerGradient
      ctx.fill()

      // Animate phase for wave motion
      phase += isActive ? 0.1 : 0.02

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [audioLevel, isActive, isSpeaking])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={200} height={200} className="drop-shadow-2xl" />
    </div>
  )
}
