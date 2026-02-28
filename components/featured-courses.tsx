"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"

export default function FeaturedCourses() {
  const featuredStreams = [
    {
      id: "frontend",
      title: "Frontend Development",
      icon: "🎨",
      description: "Master modern frontend technologies",
      color: "from-blue-50 to-cyan-50",
      courses: 6,
    },
    {
      id: "backend",
      title: "Backend Development",
      icon: "⚙️",
      description: "Build scalable server-side applications",
      color: "from-purple-50 to-pink-50",
      courses: 6,
    },
    {
      id: "fullstack",
      title: "Full Stack Development",
      icon: "🔗",
      description: "Combine frontend and backend expertise",
      color: "from-green-50 to-emerald-50",
      courses: 6,
    },
    {
      id: "datascience",
      title: "Data Science & ML",
      icon: "📊",
      description: "Explore machine learning and data analysis",
      color: "from-orange-50 to-red-50",
      courses: 6,
    },
    {
      id: "dsa",
      title: "DSA & Problem Solving",
      icon: "🧩",
      description: "Solve coding problems with AI code analysis",
      color: "from-yellow-50 to-amber-50",
      courses: 6,
    },
    {
      id: "aptitude",
      title: "Aptitude Test",
      icon: "🎯",
      description: "Prepare for quantitative and logical reasoning",
      color: "from-cyan-50 to-blue-50",
      courses: 6,
    },
  ]

  return (
    <div className="mb-6 md:mb-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Explore Courses</h2>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Choose your career path and specialize in your field
          </p>
        </div>
        <Link href="/courses">
          <button className="px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm md:text-base font-semibold rounded-lg hover:shadow-lg transition-all transform hover:scale-105 w-full sm:w-auto">
            View All Courses
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {featuredStreams.map((stream) => (
          <Link key={stream.id} href={`/courses?stream=${stream.id}`}>
            <Card className="p-4 md:p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
              <div
                className={`bg-gradient-to-br ${stream.color} p-3 md:p-4 rounded-lg mb-3 md:mb-4 group-hover:scale-110 transition-transform`}
              >
                <span className="text-3xl md:text-4xl">{stream.icon}</span>
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {stream.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">{stream.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium">{stream.courses} courses</span>
                <span className="text-base md:text-lg group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
