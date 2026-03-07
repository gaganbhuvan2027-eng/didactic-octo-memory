"use client"

import { useState } from "react"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { CountrySelector } from "@/components/country-selector"
import { RazorpayCheckout } from "@/components/razorpay-checkout"
import type { PlanId } from "@/lib/payment-plans"

export default function SubscriptionPage() {
  const [country, setCountry] = useState("india")

  const isIndia = country === "india"

  const plans: Array<{
    planId?: PlanId
    name: string
    price: string
    period: string
    amount: number
    currency: "INR" | "USD"
    description: string
    features: string[]
    cta: string
    highlighted: boolean
    href?: string
  }> = [
    {
      planId: "one_week",
      name: "One Week",
      price: isIndia ? "₹199" : "$7",
      period: isIndia ? "" : "/week",
      amount: isIndia ? 19900 : 700,
      currency: isIndia ? "INR" : "USD",
      description: "Unlimited interviews for 7 days",
      features: [
        "Unlimited interviews",
        "All interview types",
        "AI feedback & analytics",
        "Full access for 1 week",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      planId: "one_month",
      name: "One Month",
      price: isIndia ? "₹299" : "$13",
      period: isIndia ? "" : "/month",
      amount: isIndia ? 29900 : 1300,
      currency: isIndia ? "INR" : "USD",
      description: "Unlimited interviews for 30 days",
      features: [
        "Unlimited interviews",
        "All interview types",
        "AI feedback & analytics",
        "Full access for 1 month",
      ],
      cta: "Get Started",
      highlighted: true,
    },
    {
      planId: "credits_pack",
      name: "Credits Pack",
      price: isIndia ? "₹299" : "$13",
      period: "",
      amount: isIndia ? 29900 : 1300,
      currency: isIndia ? "INR" : "USD",
      description: "60 credits, never expire",
      features: [
        "60 credits",
        "No expiry",
        "Use anytime",
        "All interview types",
      ],
      cta: "Buy Credits",
      highlighted: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      amount: 0,
      currency: "INR",
      description: "For teams and organizations",
      features: [
        "Bulk licensing",
        "Team management",
        "Custom integrations",
        "Dedicated support",
      ],
      cta: "Contact Sales",
      highlighted: false,
      href: "/contact",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-6">Choose the perfect plan for your interview preparation</p>
          <div className="flex flex-col items-center">
            <CountrySelector value={country} onChange={setCountry} className="mx-auto" />
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 transition-all duration-300 animate-fade-in ${
                plan.highlighted
                  ? "bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-400 shadow-xl scale-105"
                  : "bg-gray-50 border border-gray-200 hover:shadow-lg"
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.highlighted && (
                <div className="mb-4 inline-block px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2 text-gray-900">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                {plan.period && <span className="text-gray-600 ml-2">{plan.period}</span>}
              </div>

              {plan.href ? (
                <Link href={plan.href}>
                  <button
                    className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                      plan.highlighted
                        ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-lg hover:shadow-blue-400/30"
                        : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Link>
              ) : plan.planId ? (
                <RazorpayCheckout
                  planId={plan.planId}
                  planName={plan.name}
                  amount={plan.amount}
                  currency={plan.currency}
                  isIndia={isIndia}
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white hover:shadow-lg hover:shadow-blue-400/30"
                      : "bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {plan.cta}
                </RazorpayCheckout>
              ) : null}

              <div className="space-y-4">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 rounded-2xl p-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: "Do credits expire?", a: "Credits Pack credits never expire. Use them whenever you need." },
              { q: "What's the difference between plans?", a: "One Week and One Month give unlimited interviews for the period. Credits Pack gives 60 credits with no expiry." },
              { q: "How many credits does an interview use?", a: "Interviews: 5 min = 1 credit, 15 min = 3, 30 min = 6. DSA/Aptitude: 15 min = 1, 30 min = 2, 45 min = 3." },
              {
                q: "How do I contact for Enterprise?",
                a: "Reach out through Contact Sales for custom pricing and team plans.",
              },
            ].map((item, i) => (
              <div key={i}>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">{item.q}</h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
