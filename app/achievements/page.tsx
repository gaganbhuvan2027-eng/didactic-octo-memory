"use client"

import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AchievementsPage() {
  const achievements = [
    {
      id: 1,
      name: "First Interview",
      description: "Complete your first mock interview",
      icon: "🎯",
      unlocked: true,
      date: "Dec 1, 2024",
    },
    {
      id: 2,
      name: "Perfect Score",
      description: "Achieve a 100% score in an interview",
      icon: "⭐",
      unlocked: true,
      date: "Dec 10, 2024",
    },
    {
      id: 3,
      name: "Consistency",
      description: "Complete 5 interviews in a week",
      icon: "🔥",
      unlocked: true,
      date: "Dec 15, 2024",
    },
    {
      id: 4,
      name: "Master Interviewer",
      description: "Complete 50 interviews",
      icon: "👑",
      unlocked: false,
      progress: "12/50",
    },
    {
      id: 5,
      name: "Speed Runner",
      description: "Complete an interview in under 20 minutes",
      icon: "⚡",
      unlocked: false,
      progress: "0/1",
    },
    {
      id: 6,
      name: "Improvement Master",
      description: "Improve your score by 20 points",
      icon: "📈",
      unlocked: false,
      progress: "15/20",
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Achievements</h1>
          <p className="text-lg text-gray-600">Unlock badges and milestones as you progress.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <p className="text-sm text-gray-600 mb-2">Achievements Unlocked</p>
            <p className="text-4xl font-bold text-blue-600">3/6</p>
          </Card>
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
            <p className="text-sm text-gray-600 mb-2">Total Points</p>
            <p className="text-4xl font-bold text-green-600">2,450</p>
          </Card>
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
            <p className="text-sm text-gray-600 mb-2">Current Streak</p>
            <p className="text-4xl font-bold text-purple-600">7 days</p>
          </Card>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`p-6 border-0 shadow-sm transition-all ${
                achievement.unlocked ? "bg-gradient-to-br from-yellow-50 to-white" : "bg-gray-50 opacity-60"
              }`}
            >
              <div className="text-4xl mb-4">{achievement.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{achievement.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
              {achievement.unlocked ? (
                <Badge className="bg-green-100 text-green-800">Unlocked {achievement.date}</Badge>
              ) : (
                <Badge className="bg-gray-200 text-gray-700">{achievement.progress}</Badge>
              )}
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
