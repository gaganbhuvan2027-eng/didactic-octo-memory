"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { CreditsDisplay } from "@/components/credits-display"
import ExitOnPopstateExit from "@/components/exit-on-popstate-exit"

export default function DashboardNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-100 z-50"> 
      {/* Exit handler for popstate entries that want to take user out of the site */}
      <ExitOnPopstateExit />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent"
        >
          MockZen
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/resume" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Resume
          </Link>
          <Link href="/history" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            History
          </Link>
          <Link href="/performance" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Performance
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            Pricing
          </Link>
          <Link href="/my-institute" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
            My Institution
          </Link>

          <CreditsDisplay />

          <NotificationsDropdown />

          {/* User Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-3">
            <div className="pb-2 border-b">
              <CreditsDisplay />
            </div>
            <Link href="/dashboard" className="block text-gray-600 hover:text-gray-900 font-medium">
              Dashboard
            </Link>
            <Link href="/dashboard/resume" className="block text-gray-600 hover:text-gray-900 font-medium">
              Resume
            </Link>
            <Link href="/history" className="block text-gray-600 hover:text-gray-900 font-medium">
              History
            </Link>
            <Link href="/performance" className="block text-gray-600 hover:text-gray-900 font-medium">
              Performance
            </Link>
            <Link href="/pricing" className="block text-gray-600 hover:text-gray-900 font-medium">
              Pricing
            </Link>
            <Link href="/my-institute" className="block text-gray-600 hover:text-gray-900 font-medium">
              My Institution
            </Link>
            <Link href="/profile" className="block text-gray-600 hover:text-gray-900 font-medium">
              Profile
            </Link>
            <Link href="/settings" className="block text-gray-600 hover:text-gray-900 font-medium">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

export { DashboardNavbar }
