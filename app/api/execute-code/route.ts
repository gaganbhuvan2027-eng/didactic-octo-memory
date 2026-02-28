import { NextResponse } from "next/server"

const JUDGE0_URL = "https://ce.judge0.com"

// Judge0 CE language IDs
const LANGUAGE_IDS: Record<string, number> = {
  Python: 71,
  JavaScript: 63,
  Java: 62,
  "C++": 54,
}

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }
    const languageId = LANGUAGE_IDS[language] ?? LANGUAGE_IDS.Python
    const res = await fetch(`${JUDGE0_URL}/submissions/?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: "",
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const errMsg = data.message || data.error || (typeof data === "string" ? data : "Execution failed")
      return NextResponse.json({ error: errMsg, stdout: "", stderr: errMsg }, { status: res.status >= 400 ? res.status : 502 })
    }
    // Judge0: status.id 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit, 6 = Compilation Error, etc.
    const stdout = data.stdout ?? ""
    const stderr = data.stderr ?? data.compile_output ?? ""
    const statusId = data.status?.id ?? 0
    const message = data.message ?? ""
    const combinedStderr = stderr + (message ? (stderr ? "\n" : "") + message : "")
    return NextResponse.json({ stdout, stderr: combinedStderr, statusId })
  } catch (err) {
    console.error("[execute-code] Error:", err)
    return NextResponse.json(
      { error: "Failed to execute code", stdout: "", stderr: String(err) },
      { status: 500 }
    )
  }
}
