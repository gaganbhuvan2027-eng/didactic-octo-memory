"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SuperAdminLogout() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/super-admin/logout", { method: "POST" })
      // Clear local storage
      localStorage.removeItem("super_admin_token")
      localStorage.removeItem("super_admin_email")
      // Redirect to login
      router.push("/super-admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect even if API call fails
      localStorage.removeItem("super_admin_token")
      localStorage.removeItem("super_admin_email")
      router.push("/super-admin/login")
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      className="px-4 py-2 text-sm font-medium"
    >
      Logout
    </Button>
  )
}

