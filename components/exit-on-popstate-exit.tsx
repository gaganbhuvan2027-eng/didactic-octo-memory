"use client"

import { useEffect } from "react"

export default function ExitOnPopstateExit() {
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      try {
        if (e.state && (e.state as any).exitOnNextBack) {
          console.log('[v0] exit-on-popstate-exit: detected exitOnNextBack -> going back one more step to exit site')
          // Remove the marker to avoid repeated behavior
          try {
            history.replaceState(null, '', window.location.href)
          } catch (err) {
            console.warn('[v0] exit-on-popstate-exit: failed to clear replaced state', err)
          }

          // Move back one more entry (this will typically take the user out of the web app to the previous external page)
          history.go(-1)
        }
      } catch (err) {
        console.warn('[v0] exit-on-popstate-exit handler error:', err)
      }
    }

    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  return null
}
