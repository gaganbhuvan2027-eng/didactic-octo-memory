"use client"

import { useEffect, useState } from "react"

interface AiAvatarProps {
  isSpeaking: boolean
  isListening: boolean
}

export default function AiAvatar({ isSpeaking, isListening }: AiAvatarProps) {
  const [blinkState, setBlinkState] = useState(false)

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlinkState(true)
        setTimeout(() => setBlinkState(false), 150)
      },
      3000 + Math.random() * 2000,
    )

    return () => clearInterval(blinkInterval)
  }, [])

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-indigo-400 rounded-full blur-3xl" />
      </div>

      {/* Avatar container */}
      <div className="relative z-10">
        <svg
          width="280"
          height="320"
          viewBox="0 0 280 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${isListening ? "animate-nod" : ""}`}
        >
          {/* Head */}
          <ellipse cx="140" cy="140" rx="100" ry="120" fill="#FFD4A3" />

          {/* Hair */}
          <path
            d="M 40 100 Q 40 40 140 40 Q 240 40 240 100 Q 240 80 220 70 Q 200 60 180 65 Q 160 50 140 50 Q 120 50 100 65 Q 80 60 60 70 Q 40 80 40 100 Z"
            fill="#2C1810"
          />

          {/* Ears */}
          <ellipse cx="40" cy="140" rx="15" ry="25" fill="#FFD4A3" />
          <ellipse cx="240" cy="140" rx="15" ry="25" fill="#FFD4A3" />

          {/* Eyes */}
          <g className={blinkState ? "opacity-0" : "opacity-100"} style={{ transition: "opacity 0.1s" }}>
            <ellipse cx="100" cy="120" rx="12" ry="16" fill="white" />
            <ellipse cx="180" cy="120" rx="12" ry="16" fill="white" />
            <circle cx="100" cy="122" r="8" fill="#2C1810" />
            <circle cx="180" cy="122" r="8" fill="#2C1810" />
            <circle cx="103" cy="119" r="3" fill="white" />
            <circle cx="183" cy="119" r="3" fill="white" />
          </g>

          {/* Eyebrows */}
          <path d="M 85 100 Q 100 95 115 100" stroke="#2C1810" strokeWidth="4" strokeLinecap="round" fill="none" />
          <path d="M 165 100 Q 180 95 195 100" stroke="#2C1810" strokeWidth="4" strokeLinecap="round" fill="none" />

          {/* Nose */}
          <path d="M 140 140 L 135 155 Q 140 158 145 155 Z" fill="#FFB380" />

          {/* Mouth - changes based on speaking state */}
          {isSpeaking ? (
            <g className="animate-speak">
              <ellipse cx="140" cy="185" rx="25" ry="20" fill="#8B4513" className="mouth-open" />
              <ellipse cx="140" cy="185" rx="25" ry="12" fill="#FF6B9D" className="mouth-open" />
              {/* Teeth */}
              <rect x="125" y="175" width="30" height="8" fill="white" rx="2" className="mouth-open" />
            </g>
          ) : (
            <path d="M 115 185 Q 140 195 165 185" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" fill="none" />
          )}

          {/* Neck */}
          <rect x="110" y="240" width="60" height="40" fill="#FFD4A3" rx="10" />

          {/* Shirt */}
          <path d="M 80 280 L 110 260 L 140 270 L 170 260 L 200 280 L 200 320 L 80 320 Z" fill="#4F46E5" />

          {/* Collar */}
          <path d="M 110 260 L 120 280 L 140 270 L 160 280 L 170 260" fill="#3730A3" />
        </svg>

        {/* Status indicator */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white rounded-full shadow-lg border-2 border-gray-200">
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Speaking...</span>
              </>
            )}
            {isListening && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Listening...</span>
              </>
            )}
            {!isSpeaking && !isListening && (
              <>
                <div className="w-2 h-2 bg-gray-400 rounded-full" />
                <span className="text-sm font-medium text-gray-500">Ready</span>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes speak {
          0%,
          100% {
            transform: scaleY(1);
          }
          25% {
            transform: scaleY(1.3);
          }
          50% {
            transform: scaleY(0.8);
          }
          75% {
            transform: scaleY(1.2);
          }
        }

        @keyframes nod {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(4px) rotate(2deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(4px) rotate(-2deg);
          }
        }

        .animate-speak {
          animation: speak 0.3s ease-in-out infinite;
          transform-origin: center;
        }

        .animate-nod {
          animation: nod 2s ease-in-out infinite;
          transform-origin: center top;
        }
      `}</style>
    </div>
  )
}
