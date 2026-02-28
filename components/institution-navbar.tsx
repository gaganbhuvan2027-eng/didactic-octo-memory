"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Coins, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function InstitutionNavbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [creditBalance, setCreditBalance] = useState<number | null>(null)
  const [institutionName, setInstitutionName] = useState<string>("")

  useEffect(() => {
    fetchInstitutionData()
  }, [])

  const fetchInstitutionData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get user's institution
      const { data: profile } = await supabase
        .from("users")
        .select("institution_id")
        .eq("id", user.id)
        .single()

      if (!profile?.institution_id) return

      // Get institution name
      const { data: institution } = await supabase
        .from("institutions")
        .select("name")
        .eq("id", profile.institution_id)
        .single()

      if (institution) {
        setInstitutionName(institution.name)
      }

      // Get institution credits
      const response = await fetch("/api/institution/credits")
      if (response.ok) {
        const data = await response.json()
        setCreditBalance(data.balance || 0)
      }
    } catch (error) {
      console.error("Error fetching institution data:", error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/institution-dashboard"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          MockZen
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/institution-dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Dashboard
          </Link>
          <Link href="/institution-dashboard/batches" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Batches
          </Link>
          <Link href="/institution-dashboard/members" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Members
          </Link>
          <Link href="/institution-dashboard/schedule" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Schedule
          </Link>
          <Link href="/institution-dashboard/performance" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Performance
          </Link>
          <Link href="/institution-dashboard/leaderboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Leaderboard
          </Link>

          {/* Credits Display */}
          <Link href="/institution-dashboard/credits">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg hover:shadow-md transition-all cursor-pointer">
              <Coins className="w-5 h-5 text-yellow-600" />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 leading-none">Credits</span>
                <span className="text-lg font-bold text-yellow-700 leading-tight">
                  {creditBalance !== null ? creditBalance.toLocaleString() : "..."}
                </span>
              </div>
            </div>
          </Link>

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {institutionName.charAt(0) || "I"}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2 border-b">
                <p className="text-sm font-semibold text-gray-900">{institutionName}</p>
                <p className="text-xs text-gray-500">Institution Admin</p>
              </div>
              <DropdownMenuItem onClick={() => router.push("/institution-dashboard")}>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/institution-dashboard/credits")}>
                View Credits
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-3">
            {/* Credits Display Mobile */}
            <Link href="/institution-dashboard/credits" onClick={() => setIsOpen(false)}>
              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg mb-3">
                <Coins className="w-5 h-5 text-yellow-600" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 leading-none">Institution Credits</span>
                  <span className="text-lg font-bold text-yellow-700 leading-tight">
                    {creditBalance !== null ? creditBalance.toLocaleString() : "..."}
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/institution-dashboard" className="block text-gray-600 hover:text-gray-900 font-medium" onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>
            <Link href="/institution-dashboard/batches" className="block text-gray-600 hover:text-gray-900 font-medium" onClick={() => setIsOpen(false)}>
              Batches
            </Link>
            <Link href="/institution-dashboard/members" className="block text-gray-600 hover:text-gray-900 font-medium" onClick={() => setIsOpen(false)}>
              Members
            </Link>
            <Link href="/institution-dashboard/schedule" className="block text-gray-600 hover:text-gray-900 font-medium" onClick={() => setIsOpen(false)}>
              Schedule
            </Link>
            <Link href="/institution-dashboard/performance" className="block text-gray-600 hover:text-gray-900 font-medium" onClick={() => setIsOpen(false)}>
              Performance
            </Link>
            <Link href="/institution-dashboard/leaderboard" className="block text-gray-600 hover:text-gray-900 font-medium" onClick={() => setIsOpen(false)}>
              Leaderboard
            </Link>
            <button
              onClick={() => {
                setIsOpen(false)
                handleLogout()
              }}
              className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

