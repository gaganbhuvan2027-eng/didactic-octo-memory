export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = 10_000, ...rest } = init
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, { ...rest, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

