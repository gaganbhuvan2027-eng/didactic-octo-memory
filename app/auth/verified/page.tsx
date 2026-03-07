"use client"

import Link from "next/link"

export default function AuthVerifiedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MockZen</h1>
            <p className="text-gray-600 text-sm">Master Every Interview with AI</p>
          </div>
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You have been verified</h2>
              <p className="text-gray-600">You can continue to login.</p>
            </div>
            <Link
              href="/dashboard"
              className="block w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 text-center"
            >
              Continue to Dashboard
            </Link>
            <Link
              href="/auth"
              className="block w-full py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
