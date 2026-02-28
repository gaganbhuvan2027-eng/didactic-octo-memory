"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-[calc(100vh-5rem)] md:min-h-screen flex items-center justify-start overflow-hidden bg-white pt-16 md:pt-20 pb-8 md:pb-0">
      {/* Content - moved text to extreme left with better positioning */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div
          className={`max-w-2xl transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-4 lg:mb-6 leading-tight">
            Master Your Interview Skills with AI-Powered Practice
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 lg:mb-8 leading-relaxed">
            Experience real-time voice conversations with our advanced AI interviewer. Get instant feedback,
            personalized insights, and practice with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link href="/auth?mode=signup">
              <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white font-semibold hover:shadow-xl hover:shadow-blue-400/40 transition-all duration-300 transform hover:scale-105 w-full sm:w-auto text-sm sm:text-base">
                Start Free Practice
              </button>
            </Link>
            <Link href="/auth">
              <button className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-300 w-full sm:w-auto text-sm sm:text-base">
                Login
              </button>
            </Link>
          </div>

          <div className="mt-6 lg:mt-8 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Instant feedback</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
