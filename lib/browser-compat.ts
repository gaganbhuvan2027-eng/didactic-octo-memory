/**
 * Browser compatibility for voice/video interviews.
 * Only Chrome and Edge are supported - Firefox, Safari, and others may have issues
 * with Web Locks API, speech recognition, and media APIs.
 */
export function isChromeOrEdge(): boolean {
  if (typeof navigator === "undefined") return true // SSR
  const ua = navigator.userAgent.toLowerCase()
  const isChrome = ua.includes("chrome") && !ua.includes("edg")
  const isEdge = ua.includes("edg")
  return isChrome || isEdge
}

export const BROWSER_REQUIRED_MESSAGE =
  "Please use Chrome or Edge for voice and video interviews. Other browsers are not supported."
