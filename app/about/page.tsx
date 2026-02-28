"use client"

import Navbar from "@/components/navbar"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About MockZen</h1>
          <p className="text-xl text-gray-600">Revolutionizing interview preparation with AI-powered mock interviews</p>
        </div>

        {/* Mission */}
        <section className="mb-16 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            At MockZen, we believe that everyone deserves access to world-class interview preparation. Our mission is
            to democratize interview coaching by providing AI-powered mock interviews that help candidates prepare
            confidently for their dream jobs.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We combine cutting-edge artificial intelligence with real-world interview scenarios to create an immersive
            preparation experience that builds confidence and improves performance.
          </p>
        </section>

        {/* Vision */}
        <section className="mb-16 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
          <p className="text-gray-700 leading-relaxed">
            We envision a world where interview anxiety is eliminated through proper preparation, and every candidate
            has the tools and confidence to succeed in their interviews, regardless of their background or resources.
          </p>
        </section>

        {/* Values */}
        <section className="mb-16 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h2 className="text-3xl font-bold mb-8">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Excellence", desc: "We strive for the highest quality in everything we do" },
              { title: "Accessibility", desc: "Making interview prep available to everyone" },
              { title: "Innovation", desc: "Continuously improving with latest AI technology" },
              { title: "Integrity", desc: "Building trust through transparency and honesty" },
            ].map((value, i) => (
              <div key={i} className="p-6 bg-blue-50 rounded-lg">
                <h3 className="text-xl font-bold mb-2 text-blue-600">{value.title}</h3>
                <p className="text-gray-700">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h2 className="text-3xl font-bold mb-8">Why Choose MockZen?</h2>
          <ul className="space-y-4">
            {[
              "AI-powered interviews that adapt to your skill level",
              "Real-time feedback and performance analytics",
              "Comprehensive question bank across all industries",
              "Video recording and transcript analysis",
              "Personalized improvement recommendations",
              "Affordable pricing with flexible plans",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-lg text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}
