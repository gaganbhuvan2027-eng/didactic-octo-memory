"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  {
    label: "Interviews",
    hasDropdown: true,
    items: [
      { label: "All", href: "/interviews", authRequired: true },
      { label: "By Course", href: "/interviews?tab=course", authRequired: true },
      { label: "By Company", href: "/interviews?tab=company", authRequired: true },
      { label: "By Role", href: "/interviews?tab=role", authRequired: true },
      { label: "Tests", href: "/interviews?tab=tests", authRequired: true },
      { label: "Other Interviews", href: "/interviews?tab=other", authRequired: true },
      { label: "System Design", href: "/interview/other/system-design", authRequired: true },
    ],
  },
  {
    label: "Resume",
    hasDropdown: true,
    items: [
      { label: "Resume Analyzer", href: "/dashboard/resume", authRequired: true },
    ],
  },
  { label: "Jobs", href: "/courses", authRequired: true },
  { label: "Pricing", href: "/subscription" },
  {
    label: "Business Solutions",
    hasDropdown: true,
    highlight: true,
    items: [
      { label: "For Colleges", href: "/contact", authRequired: false },
      { label: "For Recruiters", href: "/contact", authRequired: false },
      { label: "Enterprise", href: "/contact", authRequired: false },
    ],
  },
  { label: "Contact Us", href: "/contact" },
]

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const closeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  const handleDropdownEnter = (label: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    setActiveDropdown(label)
  }

  const handleDropdownLeave = () => {
    closeTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 100)
  }

  const router = useRouter()

  const handleNavItemClick = async (e: React.MouseEvent, subItem: { href: string; authRequired?: boolean }) => {
    if (!subItem.authRequired) return
    e.preventDefault()
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      window.location.href = "/auth"
      return
    }
    router.push(subItem.href)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent"
          >
            MockZen
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasDropdown && handleDropdownEnter(item.label)}
                onMouseLeave={handleDropdownLeave}
              >
                {item.hasDropdown ? (
                  <>
                    <button
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.highlight
                          ? "text-blue-600 hover:bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 pt-1">
                        <div className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {item.items?.map((subItem) =>
                          (subItem as { isSectionHeader?: boolean }).isSectionHeader ? (
                            <div
                              key={subItem.label}
                              className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                            >
                              {subItem.label}
                            </div>
                          ) : subItem.authRequired ? (
                            <button
                              key={subItem.label}
                              type="button"
                              onClick={(e) => subItem.href && handleNavItemClick(e, subItem)}
                              className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              {subItem.label}
                            </button>
                          ) : subItem.href ? (
                            <Link
                              key={subItem.label}
                              href={subItem.href}
                              className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              {subItem.label}
                            </Link>
                          ) : null
                        )}
                        </div>
                      </div>
                    )}
                  </>
                ) : item.authRequired ? (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault()
                      const supabase = createClient()
                      const { data: { user }, error } = await supabase.auth.getUser()
                      if (error || !user) {
                        window.location.href = "/auth"
                        return
                      }
                      router.push(item.href || "/")
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href || "/"}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Auth Button */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/auth"
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-300 text-white text-sm font-semibold hover:from-blue-400 hover:to-blue-200 transition-all hover:shadow-lg hover:shadow-blue-400/30"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.hasDropdown ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm font-semibold text-gray-900">
                      {item.label}
                    </div>
                    {item.items?.map((subItem) =>
                      (subItem as { isSectionHeader?: boolean }).isSectionHeader ? (
                        <div
                          key={subItem.label}
                          className="px-6 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {subItem.label}
                        </div>
                      ) : subItem.authRequired && subItem.href ? (
                        <button
                          key={subItem.label}
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault()
                            const supabase = createClient()
                            const { data: { user }, error } = await supabase.auth.getUser()
                            if (error || !user) {
                              window.location.href = "/auth"
                              return
                            }
                            setIsMobileMenuOpen(false)
                            router.push(subItem.href)
                          }}
                          className="block w-full text-left px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          {subItem.label}
                        </button>
                      ) : subItem.href ? (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className="block px-6 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ) : null
                    )}
                  </div>
                ) : item.authRequired ? (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault()
                      const supabase = createClient()
                      const { data: { user }, error } = await supabase.auth.getUser()
                      if (error || !user) {
                        window.location.href = "/auth"
                        return
                      }
                      setIsMobileMenuOpen(false)
                      router.push(item.href || "/")
                    }}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <Link
                    href={item.href || "/"}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-4 border-t border-gray-100 mt-4">
              <Link
                href="/auth"
                className="block w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-300 text-white text-sm font-semibold text-center hover:from-blue-400 hover:to-blue-200 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
