/**
 * Avatar video cache - download videos during prepare phase and use cached blobs during interview.
 * Fixes blur/black issues on some devices caused by streaming/codec problems.
 */

const CACHE_NAME = "mockaai-avatar-videos"

export const AVATAR_VIDEO_PATHS: Record<string, { intro: string; speaking: string; idle: string }> = {
  claire: {
    intro: "/avatars/claire%20%201.mp4",
    speaking: "/avatars/claire%202.mp4",
    idle: "/avatars/claire%203%20%282%29.mp4",
  },
}

export type AvatarId = keyof typeof AVATAR_VIDEO_PATHS

export interface CachedAvatarUrls {
  intro: string
  speaking: string
  idle: string
}

/**
 * Fetch a video URL and store in Cache API. Returns blob URL for immediate use.
 */
async function fetchAndCacheVideo(
  url: string,
  cacheKey: string
): Promise<string> {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const fullUrl = url.startsWith("/") ? `${origin}${url}` : url

  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(cacheKey)
  if (cached) {
    const blob = await cached.blob()
    return URL.createObjectURL(blob)
  }

  const res = await fetch(fullUrl)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  await cache.put(cacheKey, res.clone())
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

/**
 * Preload and cache all avatar videos during prepare phase.
 * Call this on the prepare page before redirecting to interview.
 */
export async function cacheAvatarVideos(avatarId: string): Promise<CachedAvatarUrls | null> {
  if (typeof window === "undefined") return null

  const paths = AVATAR_VIDEO_PATHS[avatarId as AvatarId] || AVATAR_VIDEO_PATHS.claire
  const prefix = `avatar_${avatarId}_`

  try {
    const [intro, speaking, idle] = await Promise.all([
      fetchAndCacheVideo(paths.intro, `${prefix}intro`),
      fetchAndCacheVideo(paths.speaking, `${prefix}speaking`),
      fetchAndCacheVideo(paths.idle, `${prefix}idle`),
    ])

    const urls = { intro, speaking, idle }
    sessionStorage.setItem(`avatar_cache_${avatarId}`, JSON.stringify(urls))
    return urls
  } catch (err) {
    console.warn("[avatar-cache] Failed to cache avatar videos:", err)
    return null
  }
}

/**
 * Get cached blob URLs for an avatar. Returns null if not cached.
 */
export function getCachedAvatarUrls(avatarId: string): CachedAvatarUrls | null {
  if (typeof window === "undefined") return null

  try {
    const raw = sessionStorage.getItem(`avatar_cache_${avatarId}`)
    if (!raw) return null
    return JSON.parse(raw) as CachedAvatarUrls
  } catch {
    return null
  }
}

/**
 * Get avatar URLs - use cache if available, else return original paths.
 */
export function getAvatarUrls(avatarId: string): { intro: string; speaking: string; idle: string } {
  const effectiveId = avatarId === "vivek" ? "claire" : avatarId
  const cached = getCachedAvatarUrls(effectiveId)
  if (cached) return cached

  const paths = AVATAR_VIDEO_PATHS[effectiveId as AvatarId] || AVATAR_VIDEO_PATHS.claire
  return paths
}
