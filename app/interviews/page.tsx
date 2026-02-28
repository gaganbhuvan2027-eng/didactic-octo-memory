"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Building2, Briefcase, BookOpen, ClipboardList, Users, LayoutGrid } from "lucide-react"
import { CompanyLogo } from "@/components/company-logos"
import { InterviewConfigModal } from "@/components/interview-config-modal"
import streams from "@/lib/courses"
import { companies, roles, industries, roleCategories } from "@/lib/companies"

type TabType = "all" | "course" | "company" | "role" | "tests" | "other"

const VALID_TABS: TabType[] = ["all", "course", "company", "role", "tests", "other"]

function clearBodyScrollLock() {
  document.body.style.overflow = ""
  document.body.style.pointerEvents = "auto"
  document.body.removeAttribute("data-scroll-locked")
  document.body.removeAttribute("inert")
  document.documentElement.style.overflow = ""
  document.documentElement.style.pointerEvents = "auto"
}

function InterviewsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab") as TabType | null
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "all"
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)

  // Clear any stale scroll lock when page mounts (e.g. returning from About/company page)
  useEffect(() => {
    clearBodyScrollLock()
  }, [])

  // Sync tab from URL when returning (e.g. from interview-config Cancel)
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Sync URL when tab changes (so Cancel/Back returns to correct tab)
  useEffect(() => {
    const currentTab = searchParams.get("tab")
    const desiredTab = activeTab === "all" ? null : activeTab
    if (currentTab === desiredTab) return
    const params = new URLSearchParams(searchParams.toString())
    if (activeTab === "all") {
      params.delete("tab")
    } else {
      params.set("tab", activeTab)
    }
    const query = params.toString()
    const newPath = query ? `/interviews?${query}` : "/interviews"
    router.replace(newPath, { scroll: false })
  }, [activeTab, searchParams, router])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Modal state for company Interview Details
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [companyModalId, setCompanyModalId] = useState<string>("")
  const [companyModalRoleId, setCompanyModalRoleId] = useState<string | undefined>(undefined)
  const openCompanyModal = (companyId: string, roleId?: string) => {
    setCompanyModalId(companyId)
    setCompanyModalRoleId(roleId)
    setCompanyModalOpen(true)
  }
  const closeCompanyModal = () => {
    setCompanyModalOpen(false)
    setCompanyModalRoleId(undefined)
    const cleanup = () => {
      document.body.style.overflow = ""
      document.body.style.pointerEvents = "auto"
      document.body.removeAttribute("data-scroll-locked")
      document.body.removeAttribute("inert")
    }
    requestAnimationFrame(cleanup)
    setTimeout(cleanup, 150)
  }

  const tabs = [
    { id: "all" as TabType, label: "All", icon: LayoutGrid, description: "All interview types in one view" },
    { id: "course" as TabType, label: "By Course", icon: BookOpen, description: "Practice by technology or skill" },
    { id: "role" as TabType, label: "By Role", icon: Briefcase, description: "Interview for your target role" },
    { id: "company" as TabType, label: "By Company", icon: Building2, description: "Prepare for specific companies" },
    { id: "tests" as TabType, label: "Tests", icon: ClipboardList, description: "DSA and aptitude assessments" },
    { id: "other" as TabType, label: "Other Interviews", icon: Users, description: "HR, Warmup, Salary, Custom" },
  ]

  // Filter companies based on search and industry
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.industry.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesIndustry = !selectedIndustry || (() => {
      const industryLower = company.industry.toLowerCase()
      // "Finance & Banking" should match "Finance / Banking", "Finance / Investment Banking" etc.
      const filterParts = selectedIndustry.toLowerCase().split(/\s*[&\/]\s*/).filter(Boolean)
      return filterParts.some(part => industryLower.includes(part.trim()))
    })()
    return matchesSearch && matchesIndustry
  })

  // Filter roles based on search and category
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          role.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || role.category.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  // Test types (DSA and Aptitude) - separate from courses
  const testTypes = ["dsa", "aptitude"]
  // Filter courses based on search (excluding test types)
  const filteredStreams = streams.filter(stream =>
    !testTypes.includes(stream.id) && (
      stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stream.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )
  // Get test streams for Tests tab
  const testStreams = streams.filter(stream => testTypes.includes(stream.id))

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Interviews</h1>
          <p className="text-lg text-gray-600">Choose how you want to prepare for your next interview</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSearchQuery("")
                  setSelectedIndustry(null)
                  setSelectedCategory(null)
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        {(activeTab === "all" || activeTab === "course" || activeTab === "company" || activeTab === "role") && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder={
                activeTab === "all" ? "Search all interviews..." :
                activeTab === "company" ? "Search companies..." :
                activeTab === "role" ? "Search roles..." :
                "Search courses..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg border-gray-200 rounded-xl"
            />
          </div>
        )}

        {/* All Tab - all interview types listed one below the other */}
        {activeTab === "all" && (
          <div className="animate-fade-in space-y-12">
            <p className="text-gray-600 mb-6">Browse all interview types in one place</p>

            {/* By Course */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                By Course
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredStreams.map((stream) => (
                  <Link key={stream.id} href={`/interview-config/${stream.id}?returnTab=${activeTab}`}>
                    <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                      <div className={`bg-gradient-to-br ${stream.color} p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform`}>
                        <span className="text-4xl">{stream.icon}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{stream.description}</p>
                      <p className="text-xs text-blue-600 font-medium">{stream.subcourses.length} courses</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* By Role */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                By Role
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRoles.map((role) => {
                  const roundLabels: Record<string, string> = {
                    warmup: "Warm Up", coding: "Coding", technical: "Technical",
                    behavioral: "Behavioral", "system-design": "System Design",
                  }
                  const rounds = role.interviewRounds ?? ["technical", "behavioral"]
                  return (
                    <Link key={role.id} href={`/interview-config/role-${role.id}?returnTab=${activeTab}`}>
                      <Card className="p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                            {role.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{role.name}</h3>
                            <p className="text-sm text-gray-500">{role.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{role.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {rounds.slice(0, 4).map((roundId) => (
                            <span key={roundId} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                              {roundLabels[roundId] ?? roundId}
                            </span>
                          ))}
                          {rounds.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">+{rounds.length - 4}</span>
                          )}
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* By Company */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                By Company
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((company) => (
                  <Card
                    key={company.id}
                    onClick={() => openCompanyModal(company.id)}
                    className="p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full"
                  >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                          <CompanyLogo companyId={company.id} size="lg" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{company.name}</h3>
                          <p className="text-sm text-gray-500">{company.industry}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{company.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {company.interviewRounds.slice(0, 3).map((round, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{round}</span>
                        ))}
                        {company.interviewRounds.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">+{company.interviewRounds.length - 3} more</span>
                        )}
                      </div>
                      <Link
                        href={`/interviews/company/${company.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        About →
                      </Link>
                    </Card>
                ))}
              </div>
            </section>

            {/* Tests */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                Tests
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {testStreams.map((stream) => (
                  <Link key={stream.id} href={`/interview-config/${stream.id}?returnTab=${activeTab}`}>
                    <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                      <div className={`bg-gradient-to-br ${stream.color} p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform`}>
                        <span className="text-4xl">{stream.icon}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{stream.description}</p>
                      <p className="text-xs text-blue-600 font-medium">{stream.subcourses.length} topics</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Other Interviews */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Other Interviews
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href={`/interview-config/hr-interview?returnTab=${activeTab}`}>
                  <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                    <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform">
                      <span className="text-4xl">🤝</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">HR Interview</h3>
                    <p className="text-sm text-gray-600 mb-4">Practice behavioral questions, cultural fit, and soft skills assessment</p>
                    <p className="text-xs text-blue-600 font-medium">Behavioral & Cultural Fit</p>
                  </Card>
                </Link>
                <Link href={`/interview-config/warmup?returnTab=${activeTab}`}>
                  <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform">
                      <span className="text-4xl">🔥</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Warmup Interview</h3>
                    <p className="text-sm text-gray-600 mb-4">Light practice session to build confidence before your real interview</p>
                    <p className="text-xs text-blue-600 font-medium">Confidence Building</p>
                  </Card>
                </Link>
                <Link href={`/interview-config/salary-negotiation?returnTab=${activeTab}`}>
                  <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform">
                      <span className="text-4xl">💰</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Salary Negotiation</h3>
                    <p className="text-sm text-gray-600 mb-4">Master the art of negotiating your compensation package effectively</p>
                    <p className="text-xs text-blue-600 font-medium">Compensation & Benefits</p>
                  </Card>
                </Link>
              </div>
            </section>
          </div>
        )}

        {/* Course Tab - excludes DSA and Aptitude */}
        {activeTab === "course" && (
          <div className="animate-fade-in">
            <p className="text-gray-600 mb-6">Practice interviews based on specific technologies and skills</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredStreams.map((stream) => (
                <Link key={stream.id} href={`/interview-config/${stream.id}?returnTab=${activeTab}`}>
                  <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                    <div
                      className={`bg-gradient-to-br ${stream.color} p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <span className="text-4xl">{stream.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{stream.description}</p>
                    <p className="text-xs text-blue-600 font-medium">{stream.subcourses.length} courses</p>
                  </Card>
                </Link>
              ))}
            </div>
            {filteredStreams.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No courses found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* Company Tab */}
        {activeTab === "company" && (
          <div className="animate-fade-in">
            {/* Industry Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedIndustry(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !selectedIndustry ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Industries
              </button>
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => setSelectedIndustry(industry.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedIndustry === industry.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{industry.icon}</span>
                  {industry.name}
                </button>
              ))}
            </div>

            <p className="text-gray-600 mb-6">
              Prepare for interviews at specific companies with tailored questions and interview formats
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => (
                <Card
                  key={company.id}
                  onClick={() => openCompanyModal(company.id)}
                  className="p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                      <CompanyLogo companyId={company.id} size="lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{company.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {company.interviewRounds.slice(0, 3).map((round, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        {round}
                      </span>
                    ))}
                    {company.interviewRounds.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                        +{company.interviewRounds.length - 3} more
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/interviews/company/${company.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    About →
                  </Link>
                </Card>
              ))}
            </div>

            {filteredCompanies.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No companies found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* Role Tab */}
        {activeTab === "role" && (
          <div className="animate-fade-in">
            {/* Category Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !selectedCategory ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Roles
              </button>
              {roleCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === category.name
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>

            <p className="text-gray-600 mb-6">
              Practice interviews tailored to your target role with role-specific questions
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoles.map((role) => {
                const roundLabels: Record<string, string> = {
                  warmup: "Warm Up",
                  coding: "Coding",
                  technical: "Technical",
                  behavioral: "Behavioral",
                  "system-design": "System Design",
                }
                const rounds = role.interviewRounds ?? ["technical", "behavioral"]
                return (
                  <Link key={role.id} href={`/interview-config/role-${role.id}?returnTab=${activeTab}`}>
                    <Card className="p-6 border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                          {role.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {role.name}
                          </h3>
                          <p className="text-sm text-gray-500">{role.category}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{role.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {rounds.slice(0, 4).map((roundId) => (
                          <span key={roundId} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                            {roundLabels[roundId] ?? roundId}
                          </span>
                        ))}
                        {rounds.length > 4 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            +{rounds.length - 4}
                          </span>
                        )}
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {filteredRoles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No roles found matching your search</p>
              </div>
            )}
          </div>
        )}

        {/* Tests Tab - DSA and Aptitude only */}
        {activeTab === "tests" && (
          <div className="animate-fade-in">
            <p className="text-gray-600 mb-6">Practice coding challenges and aptitude assessments</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {testStreams.map((stream) => (
                <Link key={stream.id} href={`/interview-config/${stream.id}?returnTab=${activeTab}`}>
                  <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                    <div
                      className={`bg-gradient-to-br ${stream.color} p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <span className="text-4xl">{stream.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{stream.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{stream.description}</p>
                    <p className="text-xs text-blue-600 font-medium">{stream.subcourses.length} topics</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other Interviews Tab - HR, Warmup, Salary, Custom */}
        {activeTab === "other" && (
          <div className="animate-fade-in">
            <p className="text-gray-600 mb-6">Practice specialized interview types</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href={`/interview-config/hr-interview?returnTab=${activeTab}`}>
                <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform">
                    <span className="text-4xl">🤝</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">HR Interview</h3>
                  <p className="text-sm text-gray-600 mb-4">Practice behavioral questions, cultural fit, and soft skills assessment</p>
                  <p className="text-xs text-blue-600 font-medium">Behavioral & Cultural Fit</p>
                </Card>
              </Link>
              <Link href={`/interview-config/warmup?returnTab=${activeTab}`}>
                <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform">
                    <span className="text-4xl">🔥</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Warmup Interview</h3>
                  <p className="text-sm text-gray-600 mb-4">Light practice session to build confidence before your real interview</p>
                  <p className="text-xs text-blue-600 font-medium">Confidence Building</p>
                </Card>
              </Link>
              <Link href={`/interview-config/salary-negotiation?returnTab=${activeTab}`}>
                <Card className="p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group h-full">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-4 rounded-lg mb-4 group-hover:scale-105 transition-transform">
                    <span className="text-4xl">💰</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Salary Negotiation</h3>
                  <p className="text-sm text-gray-600 mb-4">Master the art of negotiating your compensation package effectively</p>
                  <p className="text-xs text-blue-600 font-medium">Compensation & Benefits</p>
                </Card>
              </Link>
            </div>
          </div>
        )}
      </div>

      <InterviewConfigModal
        isOpen={companyModalOpen}
        onClose={closeCompanyModal}
        type="company"
        itemId={companyModalId}
        roleId={companyModalRoleId}
      />
    </main>
  )
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </main>
    }>
      <InterviewsContent />
    </Suspense>
  )
}
