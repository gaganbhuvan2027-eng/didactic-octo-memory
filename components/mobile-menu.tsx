"use client"

import { useState } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-64">
        <nav className="flex flex-col gap-4 mt-8">
          <Link href="/" onClick={handleLinkClick} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
            Home
          </Link>
          <Link href="/about" onClick={handleLinkClick} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
            About
          </Link>
          <Link href="#features" onClick={handleLinkClick} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
            Features
          </Link>
          <Link href="/subscription" onClick={handleLinkClick} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
            Pricing
          </Link>
          <Link href="/contact" onClick={handleLinkClick} className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
            Contact
          </Link>
          <Link
            href="/auth"
            onClick={handleLinkClick}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-400 text-white font-medium text-center hover:shadow-lg hover:shadow-blue-400/30 transition-all"
          >
            Login
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
