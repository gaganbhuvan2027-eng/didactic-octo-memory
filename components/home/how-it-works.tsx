"use client"

import { useEffect, useRef, useState } from "react"
import { UserCheck, Mic, BarChart2, TrendingUp } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Select Your Interview",
    description: "Choose your desired role, company, and interview type to start your personalized practice session.",
    icon: UserCheck,
    color: "bg-blue-500",
  },
  {
    number: "02",
    title: "Practice in Real-Time",
    description: "Engage in live AI-powered mock interviews with dynamic follow-up questions just like a real interview.",
    icon: Mic,
    color: "bg-indigo-500",
  },
  {
    number: "03",
    title: "Get Instant Feedback",
    description: "Receive actionable feedback based on industry evaluation parameters and expert insights.",
    icon: BarChart2,
    color: "bg-purple-500",
  },
  {
    number: "04",
    title: "Track & Improve",
    description: "Monitor your progress with detailed analytics and keep improving through consistent practice.",
    icon: TrendingUp,
    color: "bg-pink-500",
  },
]

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Start your interview preparation journey in just 4 simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
          {/* Connection line (desktop) */}
          <div className="hidden lg:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200" />

          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = index === activeStep

            return (
              <div
                key={step.number}
                className={`relative transition-all duration-500 ${
                  isActive ? "scale-105" : "scale-100"
                }`}
                onMouseEnter={() => setActiveStep(index)}
              >
                {/* Step card */}
                <div
                  className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${
                    isActive
                      ? "border-blue-500 shadow-xl shadow-blue-500/10"
                      : "border-gray-100 shadow-lg"
                  }`}
                >
                  {/* Number badge */}
                  <div
                    className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 mx-auto transition-transform duration-300 ${
                      isActive ? "scale-110" : ""
                    }`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Step number */}
                  <div className="text-center mb-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed text-center">
                    {step.description}
                  </p>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 flex justify-center gap-2">
                  {steps.map((_, dotIndex) => (
                    <div
                      key={dotIndex}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        dotIndex === activeStep
                          ? "bg-blue-600 w-6"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
