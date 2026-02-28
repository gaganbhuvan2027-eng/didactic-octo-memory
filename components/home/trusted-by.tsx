"use client"

import { useEffect, useRef } from "react"
import { CompanyLogo } from "@/components/company-logos"

const trustedCompanies = [
  { name: "Google", id: "google" },
  { name: "Amazon", id: "amazon" },
  { name: "Microsoft", id: "microsoft" },
  { name: "Meta", id: "meta" },
  { name: "Apple", id: "apple" },
  { name: "Netflix", id: "netflix" },
  { name: "TCS", id: "tcs" },
  { name: "Infosys", id: "infosys" },
  { name: "Wipro", id: "wipro" },
  { name: "JP Morgan", id: "jpmorgan" },
  { name: "Goldman Sachs", id: "goldman" },
  { name: "Deloitte", id: "deloitte" },
  { name: "McKinsey", id: "mckinsey" },
  { name: "Flipkart", id: "flipkart" },
  { name: "Swiggy", id: "swiggy" },
  { name: "OpenAI", id: "openai" },
]

export default function TrustedBy() {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollRef.current
    if (!scrollContainer) return

    let animationFrameId: number
    let scrollPosition = 0
    const scrollSpeed = 0.5

    const scroll = () => {
      scrollPosition += scrollSpeed
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0
      }
      scrollContainer.scrollLeft = scrollPosition
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <section className="py-12 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-500 text-sm font-medium mb-8 tracking-wide uppercase">
          Trusted by professionals from leading companies
        </p>
        
        <div
          ref={scrollRef}
          className="flex gap-12 overflow-hidden"
          style={{ scrollBehavior: "auto" }}
        >
          {/* Double the logos for infinite scroll effect */}
          {[...trustedCompanies, ...trustedCompanies].map((company, index) => (
            <div
              key={`${company.id}-${index}`}
              className="flex items-center gap-3 shrink-0 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <CompanyLogo companyId={company.id} size="md" className="w-10 h-10" />
              <span className="text-gray-700 font-medium whitespace-nowrap">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
