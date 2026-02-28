"use client"

export const dynamic = "force-dynamic"

import { useParams } from "next/navigation"
import Link from "next/link"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

import streams from "@/lib/courses"

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-100 text-green-800"
    case "Intermediate":
      return "bg-yellow-100 text-yellow-800"
    case "Advanced":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function StreamPage() {
  const params = useParams()

  const streamId = params?.stream
  const stream = streams.find((s) => s.id === streamId)

  if (!streamId) return null
  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Course not found</h1>
        <Link href="/courses" className="text-blue-500 hover:underline mt-4">
          Back to courses
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to all courses</span>
        </Link>

        {/* Stream Header */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <div className={`bg-gradient-to-br ${stream.color} p-6 rounded-2xl`}>
              <span className="text-6xl">{stream.icon}</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{stream.title}</h1>
              <p className="text-lg text-gray-600">{stream.description}</p>
            </div>
          </div>
          <p className="text-sm text-blue-600 font-medium">{stream.subcourses.length} specialized courses available</p>
        </div>

        {/* Subcourses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full Course Interview Card */}
          <Link href={`/interview-config/${stream.id}-full`}>
            <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                    Full {stream.title} Interview
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Comprehensive interview covering all {stream.subcourses.length} topics
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                  All Topics
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Test your knowledge across the entire {stream.title.toLowerCase()} domain. Questions will rotate through all subcourses.
              </p>

              <div className="flex items-center justify-end">
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105">
                  Start Full Interview
                </button>
              </div>
            </Card>
          </Link>

          {/* Individual Subcourse Cards */}
          {stream.subcourses.map((subcourse) => (
            <Link key={subcourse.id} href={`/interview-config/${stream.id}-${subcourse.id}`}>
              <Card className="p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {subcourse.name}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(subcourse.difficulty)}`}
                  >
                    {subcourse.difficulty}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{subcourse.info}</p>

                <div className="flex items-center justify-end">
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105">
                    Start Interview
                  </button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
