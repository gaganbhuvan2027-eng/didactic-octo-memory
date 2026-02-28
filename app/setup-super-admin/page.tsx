"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SetupSuperAdminPage() {
  const [email, setEmail] = useState("")
  const [secret, setSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleGrantAccess = async () => {
    if (!email) {
      setResult({ success: false, message: "Please enter an email address" })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch("/api/super-admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, secret: secret || "change-this-secret-key" }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: data.message || "Super admin access granted!" })
        setEmail("")
        setSecret("")
      } else {
        setResult({ success: false, message: data.error || "Failed to grant access" })
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Grant Super Admin Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            This page helps you grant super admin access to a user account. You can also:
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>Add email to SUPERADMIN_EMAILS env variable</li>
              <li>Set role in Supabase user metadata</li>
              <li>Use passcode via URL: /super-admin?code=YOUR_PASSCODE</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Secret Key (optional, defaults to "change-this-secret-key")
            </label>
            <Input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Leave empty for default"
            />
          </div>

          <Button onClick={handleGrantAccess} disabled={loading || !email} className="w-full">
            {loading ? "Granting Access..." : "Grant Super Admin Access"}
          </Button>

          {result && (
            <div
              className={`p-3 rounded-lg text-sm ${
                result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {result.message}
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              After granting access, the user should log out and log back in for the changes to take effect.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

