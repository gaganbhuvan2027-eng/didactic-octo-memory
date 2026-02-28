"use client"

import { useEffect, useRef, useState } from "react"
import { Target, Building, FileUser, BarChart3, FileText, Sparkles } from "lucide-react"

const benefits = [
  {
    title: "Resume Optimizer",
    description: "AI scans your resume for ATS compatibility and impact. Get concrete edits to boost your chances of getting past the first filter.",
    icon: Sparkles,
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    title: "Target Company Prep",
    description: "Go beyond generic practice. Prep for Google, Amazon, Meta, and more with rounds and questions modeled after their real process.",
    icon: Building,
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    title: "Performance Insights",
    description: "See where you shine and where to improve. We break down technical depth, communication, and problem-solving so you know exactly what to work on.",
    icon: BarChart3,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Realistic AI Mock Interviews",
    description: "Practice with AI interviewers that mimic real hiring managers. Choose from 2,000+ roles and 1,000+ companies—get feedback that actually helps.",
    icon: Target,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    title: "Resume-Driven Questions",
    description: "Upload your resume and get questions based on your experience. No more generic prompts—interviews that match your background.",
    icon: FileUser,
    gradient: "from-rose-500 to-orange-500",
  },
  {
    title: "JD-Focused Practice",
    description: "Paste a job description and practice for that exact role. Articulate your fit, answer domain questions, and nail the communication.",
    icon: FileText,
    gradient: "from-orange-500 to-amber-500",
  },
]

export default function KeyBenefits() {
  const [visibleCards, setVisibleCards] = useState<boolean[]>(new Array(benefits.length).fill(false))
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            benefits.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => {
                  const newState = [...prev]
                  newState[index] = true
                  return newState
                })
              }, index * 100)
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Key Benefits with MockZen
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Everything you need to prepare for interviews and land your dream job
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.title}
                className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 border border-gray-100 ${
                  visibleCards[index]
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${benefit.gradient} rounded-t-2xl`} />
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
