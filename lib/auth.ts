export function generateUserUUID(email: string): string {
  // Create a deterministic UUID based on email
  // Using a simple hash-based approach for consistency
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert hash to UUID format (v4-like)
  const hex = Math.abs(hash).toString(16).padStart(8, "0")
  return `${hex.slice(0, 8)}-${hex.slice(0, 4)}-4${hex.slice(0, 3)}-${hex.slice(0, 4)}-${hex.slice(0, 12)}`.padEnd(
    36,
    "0",
  )
}

export function isUserLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  const user = localStorage.getItem("mockzen_user")
  return !!user
}

export function getUser() {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem("mockzen_user")
  if (!user) return null

  const userData = JSON.parse(user)

  if (!userData.id && userData.email) {
    userData.id = generateUserUUID(userData.email)
    localStorage.setItem("mockzen_user", JSON.stringify(userData))
  }

  return userData
}
