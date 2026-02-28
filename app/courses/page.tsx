"use client"

import { useRouter } from "next/navigation"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"

import streams from "@/lib/courses"

const testTypes = ["dsa", "aptitude"]

export default function CoursesPage() {
  const router = useRouter()
  const courseStreams = streams.filter((s) => !testTypes.includes(s.id))
  const testStreams = streams.filter((s) => testTypes.includes(s.id))

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Interview Courses</h1>
          <p className="text-lg text-gray-600">Choose your career path and specialize in your field</p>
        </div>

        {/* Course Streams - excludes DSA and Aptitude */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {courseStreams.map((stream) => (
            <Card
              key={stream.id}
              className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => router.push(`/courses/${stream.id}`)}
            >
              <div
                className={`bg-gradient-to-br ${stream.color} p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform`}
              >
                <span className="text-4xl">{stream.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{stream.description}</p>
              <p className="text-xs text-blue-600 font-medium">{stream.subcourses.length} courses</p>
            </Card>
          ))}
        </div>

        {/* Tests Section - DSA and Aptitude separate */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tests</h2>
          <p className="text-gray-600 mb-6">Practice coding challenges and aptitude assessments</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {testStreams.map((stream) => (
              <Card
                key={stream.id}
                className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => router.push(`/courses/${stream.id}`)}
              >
                <div
                  className={`bg-gradient-to-br ${stream.color} p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform`}
                >
                  <span className="text-4xl">{stream.icon}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{stream.description}</p>
                <p className="text-xs text-blue-600 font-medium">{stream.subcourses.length} topics</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
