import { NextResponse } from "next/server"
import fs from "fs"

export async function POST(request: Request) {
  const headersObj: Record<string, string | null> = {}
  for (const [k, v] of request.headers) headersObj[k] = v

  let body: any = {}
  try {
    body = await request.json()
  } catch (e) {
    body = {}
  }

  const ip = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown").split(",")[0].trim()
  const ua = request.headers.get("user-agent") || ""
  const entry = {
    timestamp: Date.now(),
    ip,
    userAgent: ua,
    path: "/admin/login",
    body,
    headers: headersObj,
  }

  // Append to logs/honeypot.log
  try {
    await fs.promises.mkdir("logs", { recursive: true })
    await fs.promises.appendFile("logs/honeypot.log", JSON.stringify(entry) + "\n")
  } catch (err) {
    console.error("honeypot: failed to write log", err)
  }

  // Fire alert webhook if configured (Discord/Slack-compatible payload)
  try {
    const webhook = process.env.ADMIN_ALERT_WEBHOOK
    if (webhook) {
      const payload = {
        // Discord accepts `content`
        content: `Honeypot triggered: /admin login attempt\nIP: ${ip}\nUser-Agent: ${ua}\nEmail: ${body.email || "(unknown)"}`,
      }
      // best-effort, non-blocking
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.error("honeypot webhook error", e))
    }
  } catch (err) {
    console.error("honeypot webhook error", err)
  }

  // Always fail login on honeypot
  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
}
