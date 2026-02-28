"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface InterviewResult {
  id: string
  overall_score: number
  created_at: string
  technical_score: number
  communication_score: number
  confidence_score: number
}

interface User {
  id: string
  email: string
  name: string
  interview_results: InterviewResult[]
}

interface InstitutionMember {
  id: string
  users: User
}

export default function InstitutionGuestView({ members }: { members: InstitutionMember[] }) {
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<InstitutionMember | null>(null)

  const calculateAverageScore = (results: InterviewResult[]) => {
    if (!results || results.length === 0) return 0
    const sum = results.reduce((acc, result) => acc + result.overall_score, 0)
    return Math.round(sum / results.length)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institution Performance</h1>
          <p className="text-gray-600 mt-2">Guest View - Read Only Access</p>
        </div>
        <Button onClick={() => router.push("/auth")} variant="outline" className="gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </Button>
      </div>

      {/* Members Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card
            key={member.id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => setSelectedMember(member)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{member.users.name || "Guest User"}</CardTitle>
              <CardDescription>{member.users.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculateAverageScore(member.users.interview_results || [])}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interviews Completed</p>
                  <p className="text-xl font-semibold">{member.users.interview_results?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{selectedMember.users.name || "Guest User"}</CardTitle>
              <CardDescription>{selectedMember.users.email}</CardDescription>
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {calculateAverageScore(selectedMember.users.interview_results || [])}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interviews</p>
                  <p className="text-3xl font-bold">{selectedMember.users.interview_results?.length || 0}</p>
                </div>
              </div>

              {selectedMember.users.interview_results && selectedMember.users.interview_results.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-4">Interview History</h3>
                  <div className="space-y-3">
                    {selectedMember.users.interview_results.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{new Date(result.created_at).toLocaleDateString()}</p>
                          <p className="text-lg font-bold text-blue-600">{result.overall_score}%</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Technical</p>
                            <p className="font-semibold">{result.technical_score}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Communication</p>
                            <p className="font-semibold">{result.communication_score}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Confidence</p>
                            <p className="font-semibold">{result.confidence_score}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">No interview results yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
