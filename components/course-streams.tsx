"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"

interface Subcourse {
  id: string
  name: string
  difficulty: string
  questions: number
}

interface Stream {
  id: string
  title: string
  icon: string
  description: string
  color: string
  subcourses: Subcourse[]
}

interface CourseStreamsProps {
  stream: Stream
}

export default function CourseStreams({ stream }: CourseStreamsProps) {
  const getDifficultyColor = (difficulty: string) => {
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

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-8">
        <span className="text-5xl">{stream.icon}</span>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{stream.title}</h2>
          <p className="text-gray-600">{stream.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Full Course Interview Card */}
        <Link href={`/interview/course/${stream.id}/full`}>
          <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Full {stream.title} Interview
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Comprehensive interview covering all topics
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                All Topics
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1"></div>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105">
                Start Full Interview
              </button>
            </div>
          </Card>
        </Link>

        {/* Individual Subcourse Cards */}
        {stream.subcourses.map((subcourse) => (
          <Link key={subcourse.id} href={`/interview/course/${stream.id}/${subcourse.id}`}>
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

              <div className="flex items-center justify-between">
                <div className="flex-1"></div>
                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-105">
                  Start
                </button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
