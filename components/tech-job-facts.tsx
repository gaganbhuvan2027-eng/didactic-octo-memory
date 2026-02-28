"use client"

import { useEffect, useState } from "react"
import { Sparkles, TrendingUp, Briefcase, Code } from "lucide-react"

const techFacts = [
  {
    icon: TrendingUp,
    category: "Market Trend",
    fact: "The global tech job market is expected to grow by 13% through 2030, much faster than average.",
  },
  {
    icon: Briefcase,
    category: "Career Insight",
    fact: "Software developers with strong communication skills earn 20% more than those focused solely on technical skills.",
  },
  {
    icon: Code,
    category: "Industry Stat",
    fact: "75% of hiring managers say cultural fit is just as important as technical skills in interviews.",
  },
  {
    icon: Sparkles,
    category: "Interview Tip",
    fact: "Candidates who practice mock interviews are 3x more likely to receive job offers.",
  },
  {
    icon: TrendingUp,
    category: "Salary Insight",
    fact: "Remote tech positions now account for 40% of all software engineering job postings in 2024.",
  },
  {
    icon: Briefcase,
    category: "Career Growth",
    fact: "AI and Machine Learning roles have seen a 344% increase in demand over the past 5 years.",
  },
  {
    icon: Code,
    category: "Tech Trend",
    fact: "Full-stack developers are the most in-demand tech professionals, with 67% of companies actively hiring.",
  },
  {
    icon: Sparkles,
    category: "Interview Fact",
    fact: "The average tech interview process takes 23 days from application to offer.",
  },
  {
    icon: TrendingUp,
    category: "Market Data",
    fact: "Cloud computing skills can increase your salary potential by up to 30%.",
  },
  {
    icon: Briefcase,
    category: "Career Tip",
    fact: "Developers who contribute to open source projects are 2x more likely to get interview callbacks.",
  },
  {
    icon: Code,
    category: "Industry News",
    fact: "TypeScript has overtaken JavaScript as the most preferred language among enterprise developers.",
  },
  {
    icon: Sparkles,
    category: "Success Rate",
    fact: "Candidates who ask thoughtful questions during interviews increase their success rate by 40%.",
  },
]

export default function TechJobFacts() {
  const [currentFacts, setCurrentFacts] = useState<typeof techFacts>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const shuffled = [...techFacts].sort(() => Math.random() - 0.5)
    setCurrentFacts(shuffled.slice(0, 3))
    setIsVisible(true)
  }, [])

  return (
    <section className="py-10 sm:py-12 lg:py-16 px-4 sm:px-6 bg-gradient-to-b from-white to-blue-50/30 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Tech Industry Insights</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 text-balance px-2">
            Stay Updated with Tech Job Trends
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 text-balance px-2">
            Fresh insights updated on every visit
          </p>
        </div>

        {/* Facts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {currentFacts.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className={`group relative p-4 sm:p-5 lg:p-6 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-500 transform ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                {/* Icon and Category */}
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-blue-600">{item.category}</span>
                </div>

                {/* Fact Text */}
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{item.fact}</p>

                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-blue-600 to-blue-400 group-hover:w-full transition-all duration-500 rounded-b-xl" />
              </div>
            )
          })}
        </div>

        {/* Refresh indicator */}
        <div className="text-center mt-6 sm:mt-8">
          <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center gap-2 px-2">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
            <span>New insights appear on every page visit</span>
          </p>
        </div>
      </div>
    </section>
  )
}
