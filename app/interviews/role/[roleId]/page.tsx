"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Building2, Sparkles, Target } from "lucide-react"
import { CompanyLogo } from "@/components/company-logos"
import { companies, roles } from "@/lib/companies"

export default function RoleInterviewPage() {
  const params = useParams()
  const roleId = params?.roleId as string

  const role = roles.find((r) => r.id === roleId)

  if (!role) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Role not found</h1>
        <Link href="/interviews" className="text-blue-500 hover:underline mt-4">
          Back to interviews
        </Link>
      </div>
    )
  }

  // Get companies that hire for this role
  const roleCompanies = companies.filter((c) => role.companies.includes(c.id))

  // All possible round definitions (only show rounds relevant to this role)
  const allRoundDefs: Record<string, { name: string; icon: string; description: string; color: string }> = {
    warmup: {
      name: "Warm Up",
      icon: "🔥",
      description: `Light practice to build confidence before ${role.name} interviews`,
      color: "from-amber-50 to-orange-50",
    },
    coding: {
      name: "Coding Round",
      icon: "⌨️",
      description: `Practice coding problems for ${role.name} positions`,
      color: "from-blue-50 to-cyan-50",
    },
    technical: {
      name: "Technical Round",
      icon: "💻",
      description: `Practice technical questions specific to ${role.name} positions`,
      color: "from-blue-50 to-indigo-50",
    },
    behavioral: {
      name: "Behavioral Round",
      icon: "🤝",
      description: `Prepare for behavioral questions asked to ${role.name} candidates`,
      color: "from-green-50 to-emerald-50",
    },
    "system-design": {
      name: "System Design / Case Study",
      icon: "🧩",
      description: `Practice design problems and case studies for ${role.name} roles`,
      color: "from-purple-50 to-pink-50",
    },
  }

  // Only show rounds relevant to this role (exclude warmup and HR/behavioral)
  const excludedFromRole = ["warmup", "behavioral"]
  const relevantRounds = (role.interviewRounds ?? ["technical", "behavioral"])
    .filter((id) => !excludedFromRole.includes(id))
  const interviewTypes = relevantRounds
    .filter((id) => allRoundDefs[id])
    .map((id) => ({ id, ...allRoundDefs[id] }))

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/interviews"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to interviews</span>
        </Link>

        {/* Role Header */}
        <div className="mb-12 animate-fade-in">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center text-5xl shadow-sm">
              {role.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{role.name}</h1>
              <p className="text-lg text-gray-500 mb-3">{role.category}</p>
              <p className="text-gray-600">{role.description}</p>
            </div>
          </div>

          {/* Skills Required */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Key Skills for {role.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {role.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Interview Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Interview Rounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviewTypes.map((type) => (
              <Link key={type.id} href={`/interview-config/role-${roleId}-${type.id}`}>
                <Card className="p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        {type.name}
                      </h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Full Role Interview */}
        <div className="mb-12">
          <Link href={`/interview-config/role-${roleId}-full`}>
            <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                      Full {role.name} Interview
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Complete Prep
                    </span>
                  </div>
                  <p className="text-gray-600">
                    Comprehensive interview covering technical skills, behavioral questions, case studies, and domain knowledge
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Companies Hiring for this Role */}
        {roleCompanies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-gray-700" />
              Companies Hiring {role.name}s
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roleCompanies.map((company) => (
                <Link key={company.id} href={`/interview-config/company-${company.id}-role-${roleId}`}>
                  <Card className="p-5 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
                        <CompanyLogo companyId={company.id} size="md" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-sm text-gray-500">{company.industry}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Practice {role.name} interview specifically for {company.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <Target className="w-4 h-4" />
                      <span>{company.interviewRounds.length} interview rounds</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
