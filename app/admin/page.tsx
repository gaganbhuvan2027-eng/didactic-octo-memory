"use client"

import React, { useState } from "react"

export default function AdminHoneypotPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => null)
      setMsg((data && data.error) || "Invalid credentials")
    } catch (err) {
      setMsg("Network error")
    }
    setLoading(false)
    setPassword("")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white shadow rounded">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-4">This area is for administrators only.</p>

        {msg && <div className="mb-4 text-red-600">{msg}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            aria-label="Email"
            className="w-full p-2 border rounded"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            aria-label="Password"
            className="w-full p-2 border rounded"
            placeholder="password"
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded"
            type="submit"
          >
            {loading ? "Checking..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-400">If you believe this is in error, contact your site administrator.</p>
      </div>
    </div>
  )
}
