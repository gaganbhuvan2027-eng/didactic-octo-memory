"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const features = [
  "Real-time feedback & analytics",
  "Company-specific preparation",
  "Resume analyzer included",
]

export default function CTASection() {
  const router = useRouter()

  const handleExploreInterviews = async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      window.location.href = "/auth"
      return
    }
    router.push("/dashboard")
  }

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          {/* Badge */}
          <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-medium rounded-full mb-6 backdrop-blur-sm">
            Start Free Today
          </span>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto">
            Take Your Interview Preparation to the Next Level
          </h2>

          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Join thousands of job seekers who have successfully landed their dream jobs with MockZen
          </p>

          {/* Feature list */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-10">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth?mode=signup">
              <button className="group flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all hover:shadow-xl">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <button
              onClick={handleExploreInterviews}
              className="flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all"
            >
              Explore Interviews
            </button>
          </div>

          {/* Trust badge */}
          <p className="mt-8 text-blue-200 text-sm">
            No credit card required • Start practicing in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  )
}
