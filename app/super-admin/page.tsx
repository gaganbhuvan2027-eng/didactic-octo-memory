import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { SuperAdminDashboard } from "@/components/super-admin-dashboard"
import { verifySuperAdminSession } from "@/lib/super-admin-auth"
import { redirect } from "next/navigation"
import { SuperAdminLogout } from "@/components/super-admin-logout"

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic"

type SearchParams = { [key: string]: string | string[] | undefined }

export default async function SuperAdminPage({
  searchParams,
}: { searchParams?: { code?: string } }) {
  // Check super admin session - ONLY method of authentication
  const session = await verifySuperAdminSession()
  const resolvedSearchParams = await searchParams
  
  console.log("[super-admin/page] Session check:", session)

  // If not authorized, redirect to login (preserve secret path via query)
  if (!session.authenticated) {
    const isSecret = (resolvedSearchParams as any)?._secret_rewrite === "1"
    console.log("[super-admin/page] Not authenticated, redirecting. isSecret:", isSecret)
    
    if (isSecret) {
      const secretPath = process.env.REAL_ADMIN_PATH || "/hidden-admin"
      const redirectUrl = `/super-admin/login?redirect=${encodeURIComponent(secretPath)}&_secret_rewrite=1`
      redirect(redirectUrl)
    } else {
      redirect("/super-admin/login")
    }
  }


  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
            <p className="text-gray-600">Manage credits, institutions, members, and usage.</p>
          </div>
          <SuperAdminLogout />
        </div>

        <SuperAdminDashboard />
      </div>
    </main>
  )
}

