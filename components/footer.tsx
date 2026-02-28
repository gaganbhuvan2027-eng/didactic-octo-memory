import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 relative">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 lg:py-12">
        {/* Footer Content */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Left - Logo */}
          <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
            MockZen
          </div>

          {/* Center - Links */}
          <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap justify-center">
            <Link href="/about" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 transition-colors">
              Contact
            </Link>
            <Link href="/auth/institution" className="text-sm sm:text-base text-gray-500 hover:text-blue-600 transition-colors">
              Institution Admin
            </Link>
          </div>

          {/* Right - Copyright */}
          <div className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
            © 2025 MockZen. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
