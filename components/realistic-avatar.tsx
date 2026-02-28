"use client"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import type { LipSyncData } from "@/hooks/use-text-to-speech"

interface RealisticAvatarProps {
  isActive: boolean
  isSpeaking: boolean
  isListening: boolean
  lipSyncData?: LipSyncData
}

export default function RealisticAvatar({ isActive, isSpeaking, isListening, lipSyncData }: RealisticAvatarProps) {
  const mouthOpenness = lipSyncData?.mouthOpenness ?? 0
  const mouthShape = lipSyncData?.mouthShape ?? "closed"

  const getStatusText = () => {
    if (isSpeaking) return "Speaking..."
    if (isListening) return "Listening..."
    return "Ready"
  }

  const getStatusColor = () => {
    if (isSpeaking) return "bg-blue-500"
    if (isListening) return "bg-green-500"
    return "bg-gray-400"
  }

  const getMouthTransform = () => {
    if (!isSpeaking || mouthOpenness === 0) return "scale(1)"

    const baseScale = 1 + mouthOpenness * 0.3

    switch (mouthShape) {
      case "wide":
        return `scale(${baseScale * 1.2}, ${baseScale * 0.8})` // Wider, flatter
      case "round":
        return `scale(${baseScale}, ${baseScale})` // Circular
      case "narrow":
        return `scale(${baseScale * 0.8}, ${baseScale * 1.1})` // Narrower, taller
      case "medium":
        return `scale(${baseScale}, ${baseScale * 0.95})`
      default:
        return "scale(1)"
    }
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="relative aspect-[3/4] w-full">
        <div
          className={`absolute inset-0 transition-all duration-200 ${
            isListening ? "animate-subtle-nod" : ""
          } ${isSpeaking ? "animate-speaking" : ""}`}
        >
          {/* Background glow effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 via-purple-500/10 to-transparent z-10 pointer-events-none" />

          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-full h-full">
              <Image
                src="/professional-ai-interviewer--photorealistic-portra.jpg"
                alt="AI Interviewer"
                fill
                className="object-cover object-center"
                priority
              />

              {isSpeaking && mouthOpenness > 0 && (
                <>
                  {/* Mouth glow effect */}
                  <div
                    className="absolute bottom-[35%] left-1/2 -translate-x-1/2 w-20 h-16 rounded-full transition-all duration-75"
                    style={{
                      transform: `translateX(-50%) ${getMouthTransform()}`,
                      filter: "blur(25px)",
                      background: `radial-gradient(circle, rgba(255,255,255,${mouthOpenness * 0.15}) 0%, transparent 70%)`,
                      opacity: mouthOpenness,
                    }}
                  />

                  {/* Jaw movement shadow */}
                  <div
                    className="absolute bottom-[30%] left-1/2 -translate-x-1/2 w-32 h-20 rounded-full transition-all duration-75"
                    style={{
                      transform: `translateX(-50%) translateY(${mouthOpenness * 8}px)`,
                      filter: "blur(30px)",
                      background: "radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 60%)",
                      opacity: mouthOpenness * 0.6,
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Vignette effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none z-20" />
        </div>

        {/* Status indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full z-30 border border-white/10">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
          <span className="text-white text-sm font-medium">{getStatusText()}</span>
        </div>

        {/* AI label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 px-6 py-2.5 rounded-full z-30 border border-white/20 shadow-lg">
          <span className="text-white text-sm font-bold tracking-wide">AI INTERVIEWER</span>
        </div>

        {isSpeaking && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1 z-30">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-blue-500 rounded-full transition-all duration-75"
                style={{
                  height: `${12 + mouthOpenness * 20 + Math.sin(Date.now() / 100 + i) * 8}px`,
                  opacity: 0.5 + mouthOpenness * 0.5,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes subtle-nod {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          25% { 
            transform: translateY(3px) rotate(0.8deg); 
          }
          75% { 
            transform: translateY(-2px) rotate(-0.5deg); 
          }
        }
        
        @keyframes speaking {
          0%, 100% { 
            transform: scale(1); 
          }
          50% { 
            transform: scale(1.005); 
          }
        }
        
        .animate-subtle-nod {
          animation: subtle-nod 2.5s ease-in-out infinite;
        }
        
        .animate-speaking {
          animation: speaking 0.3s ease-in-out infinite;
        }
      `}</style>
    </Card>
  )
}
