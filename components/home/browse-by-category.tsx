"use client"

import { useRouter } from "next/navigation"
import { Building2, FileText, MessageSquare, FileCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const categories = [
  {
    id: "company",
    title: "Company Interviews",
    description: "Practice for specific companies like Google, Amazon, Meta, and 100+ more",
    icon: Building2,
    href: "/interviews",
    color: "bg-blue-500",
    hoverColor: "group-hover:bg-blue-600",
  },
  {
    id: "jd-based",
    title: "JD Based Interviews",
    description: "Upload any job description and practice with tailored questions",
    icon: FileText,
    href: "/interview-config",
    color: "bg-indigo-500",
    hoverColor: "group-hover:bg-indigo-600",
  },
  {
    id: "communication",
    title: "Communication Skills",
    description: "Improve your verbal communication, clarity, and confidence",
    icon: MessageSquare,
    href: "/courses",
    color: "bg-purple-500",
    hoverColor: "group-hover:bg-purple-600",
  },
  {
    id: "resume",
    title: "Resume Analyzer",
    description: "Get AI-powered feedback on your resume and improve it instantly",
    icon: FileCheck,
    href: "/dashboard/resume",
    color: "bg-cyan-500",
    hoverColor: "group-hover:bg-cyan-600",
  },
]

export default function BrowseByCategory() {
  const router = useRouter()

  const handleCategoryClick = async (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      window.location.href = "/auth"
      return
    }
    router.push(href.startsWith("/dashboard") ? href : "/dashboard")
  }

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            Browse by Category
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Interview Type
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Multiple ways to prepare for your dream job with AI-powered practice sessions
          </p>
        </div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                type="button"
                onClick={(e) => handleCategoryClick(e, category.href)}
                className="group relative w-full text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className={`w-14 h-14 ${category.color} ${category.hoverColor} rounded-xl flex items-center justify-center mb-4 transition-colors`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {category.description}
                  </p>

                  {/* Arrow */}
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm">
                    Explore
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* View all link */}
        <div className="text-center mt-10">
          <button
            type="button"
            onClick={(e) => handleCategoryClick(e, "/interviews")}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Interview Types
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
