"use client"

import { useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import DashboardNavbar from "@/components/dashboard-navbar"
import { CompanyLogo } from "@/components/company-logos"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Target, Linkedin, Globe, Youtube, Briefcase } from "lucide-react"
import { companies, companyInterviewDetails, roles } from "@/lib/companies"

function clearBodyScrollLock() {
  document.body.style.overflow = ""
  document.body.style.pointerEvents = "auto"
  document.body.removeAttribute("data-scroll-locked")
  document.body.removeAttribute("inert")
  document.documentElement.style.overflow = ""
  document.documentElement.style.pointerEvents = "auto"
}

export default function CompanyInterviewPage() {
  const params = useParams()
  const companyId = params?.companyId as string

  // Clear any stale scroll lock when page mounts (e.g. from modal on previous page)
  useEffect(() => {
    clearBodyScrollLock()
  }, [])

  const company = companies.find((c) => c.id === companyId)

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Company not found</h1>
        <Link href="/interviews" className="text-blue-600 hover:underline mt-4">
          Back to interviews
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <DashboardNavbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link
          href="/interviews"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to interviews
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Company Profile Card */}
          <aside className="lg:w-80 flex-shrink-0">
            <Card className="p-8 bg-white border-0 shadow-sm rounded-3xl sticky top-24 border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-6 overflow-hidden shadow-sm">
                  <CompanyLogo companyId={company.id} size="lg" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.name}</h1>
                {company.headOfficeAddress && (
                  <p className="text-sm text-gray-600 mb-4">{company.headOfficeAddress}</p>
                )}
                <p className="text-gray-600 mb-6">{company.industry}</p>

                <div className="w-full space-y-3">
                  {company.socials && (company.socials.linkedin || company.socials.twitter || company.socials.website || company.socials.youtube) && (
                    <div className="flex justify-center gap-3">
                      {company.socials.linkedin && (
                        <a
                          href={company.socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                      {company.socials.twitter && (
                        <a
                          href={company.socials.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label="X (Twitter)"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                      )}
                      {company.socials.website && (
                        <a
                          href={company.socials.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label="Website"
                        >
                          <Globe className="w-5 h-5" />
                        </a>
                      )}
                      {company.socials.youtube && (
                        <a
                          href={company.socials.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label="YouTube"
                        >
                          <Youtube className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  )}

                  <Link
                    href="/results"
                    className="block w-full py-3 px-4 text-center text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-medium rounded-xl transition-colors"
                  >
                    View Interview Stories →
                  </Link>
                </div>
              </div>
            </Card>
          </aside>

          {/* Right: Interview Process Content */}
          <div className="flex-1 min-w-0">
            <div className="space-y-8 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {company.name} interview process
                  </h2>
                  <p className="text-gray-600 mb-6">Understand the complete interview journey</p>
                </div>

                {/* Process Flow */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-teal-600" />
                    Interview Process Flow
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {company.interviewRounds.map((round, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                          <span className="w-6 h-6 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{round}</span>
                        </div>
                        {idx < company.interviewRounds.length - 1 && (
                          <span className="text-teal-400 font-bold">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roles at this company */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-teal-600" />
                    Roles at {company.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Popular roles {company.name} hires for
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {(company.popularRoles || []).map((roleId) => {
                      const role = roles.find((r) => r.id === roleId)
                      const label = role ? role.name : roleId.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
                      return (
                        <span
                          key={roleId}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
                        >
                          {role && <span>{role.icon}</span>}
                          {label}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Interview Details */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Interview Details</h3>
                  <p className="text-gray-600 mb-6">
                    Key insights about {company.name}&apos;s interview process, stages, and preparation tips to help you succeed.
                  </p>
                  <ul className="space-y-3">
                    {(companyInterviewDetails[companyId] || [
                      "Process typically includes resume screening, recruiter call, technical rounds, and final interview.",
                      "Technical roles focus on coding, algorithms, system design, and problem-solving.",
                      "Behavioral roles emphasize culture fit, leadership, and past experience.",
                      "Tip: Research the company's values and mission; align your answers accordingly.",
                      "Tip: Practice explaining your thought process aloud; communication is key.",
                    ]).map((point, idx) => (
                      <li key={idx} className="flex gap-3 text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-medium mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
          </div>
        </div>
      </div>
    </main>
  )
}
