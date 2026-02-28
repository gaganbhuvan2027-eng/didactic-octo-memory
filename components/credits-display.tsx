"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function CreditsDisplay() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname();

  useEffect(() => {
    fetchCredits()
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [pathname])

  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits")
      const data = await res.json().catch(() => ({}))
      // Handle unexpected / empty API responses gracefully
      if (!data || typeof data !== 'object' || (!('balance' in data) && !data.error)) {
        console.warn("CreditsDisplay - fetchCredits: Unexpected API response, defaulting to 0:", data)
        setBalance(0)
      } else if (res.ok) {
        const bal = typeof data.balance === 'number' ? data.balance : 0
        setBalance(bal)
        console.debug("CreditsDisplay - fetchCredits: Setting balance to:", bal)
      } else {
        // API returned an error payload
        if (res.status === 401) {
          // Not authenticated — expected on public pages (e.g. pricing), show 0 silently
          setBalance(0)
        } else {
          console.error("CreditsDisplay - fetchCredits: Error in API response:", data.error || data)
          setBalance(0)
        }
      }
    } catch (error) {
      console.error("CreditsDisplay - Error fetching credits:", error)
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }

  // Expose refresh function to window for manual refresh if needed
  useEffect(() => {
    ;(window as any).refreshCredits = fetchCredits
    return () => {
      delete (window as any).refreshCredits
    }
  }, [])

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200">
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-semibold text-blue-600">
                  {loading ? "..." : balance ?? 0}
                </span>
              </div>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                ?
              </span>
            </button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to learn about credits</p>
        </TooltipContent>
      </Tooltip>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>How Credits Work</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">What are Credits?</h3>
            <p>
              Credits are used to start mock interviews. Credits are charged based on the <strong>selected duration</strong> you choose when starting the interview.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Credit Costs:</h3>
            <p className="text-sm text-gray-600 mb-2">Interviews (role, technical, coding):</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
              <li><strong>5 minutes:</strong> 1 credit</li>
              <li><strong>15 minutes:</strong> 3 credits</li>
              <li><strong>30 minutes:</strong> 6 credits</li>
            </ul>
            <p className="text-sm text-gray-600 mb-2">DSA & Aptitude tests:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>15 minutes:</strong> 1 credit</li>
              <li><strong>30 minutes:</strong> 2 credits</li>
              <li><strong>45 minutes:</strong> 3 credits</li>
            </ul>
            <p className="text-xs text-gray-500 mt-2">
              Cost is based on the duration you select when starting, not actual time taken.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Getting Credits:</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>New users receive <strong>5 free credits</strong> when they sign up</li>
              <li>Contact support to purchase additional credits</li>
              <li>Institution members may receive credits from their admin</li>
            </ul>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500">
              Your current balance: <strong className="text-blue-600">{balance ?? 0} credits</strong>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

