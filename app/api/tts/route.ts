import { NextRequest, NextResponse } from "next/server"

const INWORLD_API_URL = "https://api.inworld.ai/tts/v1/voice"

// Voice IDs - Inworld uses capitalized names (Alex, Ashley, etc.)
const VOICES: Record<string, string> = {
  alex: "Alex",
  ashley: "Ashley",
  timothy: "Timothy",
  olivia: "Olivia",
  sarah: "Sarah",
  michael: "Michael",
  emma: "Emma",
  james: "James",
  dennis: "Dennis",
}

// Normalize API key: Inworld expects "Basic <base64>" - get from Settings > API Keys > Copy Base64
function getAuthHeader(apiKey: string): string {
  const trimmed = apiKey.trim().replace(/^["']|["']$/g, "") // Remove surrounding quotes
  // If it contains ":" and doesn't look like base64, it might be workspace:key format
  if (trimmed.includes(":") && !/^[A-Za-z0-9+/=]+$/.test(trimmed.replace(":", ""))) {
    return `Basic ${Buffer.from(trimmed).toString("base64")}`
  }
  // Strip "Basic " if user pasted the full header
  const credentials = trimmed.replace(/^Basic\s+/i, "").trim()
  return `Basic ${credentials}`
}

// GET /api/tts - Test if Inworld API key works (visit in browser or curl)
export async function GET() {
  const apiKey = process.env.INWORLD_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "INWORLD_API_KEY not set in .env.local",
      hint: "Get key from https://platform.inworld.ai > Settings > API Keys > Copy Base64",
    }, { status: 500 })
  }

  try {
    const authHeader = getAuthHeader(apiKey)
    const res = await fetch(INWORLD_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader },
      body: JSON.stringify({
        text: "Test",
        voiceId: "Alex",
        modelId: "inworld-tts-1.5-mini",
      }),
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}

    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: data.message || data.details || `HTTP ${res.status}`,
        status: res.status,
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: "Inworld TTS is working",
      hasAudio: !!data.audioContent,
    })
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Request failed",
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId = "alex" } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.INWORLD_API_KEY?.trim()

    if (!apiKey) {
      console.error("INWORLD_API_KEY not configured in .env.local")
      return NextResponse.json(
        { error: "TTS not configured. Add INWORLD_API_KEY to .env.local (get from platform.inworld.ai > Settings > API Keys > Copy Base64)" },
        { status: 500 }
      )
    }

    const authHeader = getAuthHeader(apiKey)

    // Per-interviewer cloned voices (env), else built-in voices
    const claireVoiceId = process.env.INWORLD_VOICE_ID_CLAIRE?.trim()
    const vivekVoiceId = process.env.INWORLD_VOICE_ID?.trim()
    let voiceIdToUse: string
    if (voiceId === "claire" && claireVoiceId) {
      voiceIdToUse = claireVoiceId
    } else if (voiceId === "claire") {
      voiceIdToUse = "Ashley" // US English fallback when INWORLD_VOICE_ID_CLAIRE not set
    } else if (voiceId === "vivek" && vivekVoiceId) {
      voiceIdToUse = vivekVoiceId
    } else {
      voiceIdToUse = VOICES[voiceId as keyof typeof VOICES] || "Alex"
    }

    const payload = {
      text: text.substring(0, 2000),
      voiceId: voiceIdToUse,
      modelId: "inworld-tts-1.5-mini",
    }

    const response = await fetch(INWORLD_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    let errorData: { message?: string; code?: number; details?: unknown } = {}
    try {
      errorData = responseText ? JSON.parse(responseText) : {}
    } catch {
      errorData = { message: responseText || `HTTP ${response.status}` }
    }

    if (!response.ok) {
      const errMsg = errorData.message || errorData.details?.toString?.() || `Inworld API error: ${response.status}`
      console.error("Inworld TTS API error:", response.status, errMsg)
      return NextResponse.json(
        { error: errMsg, details: errorData },
        { status: response.status }
      )
    }

    const data = JSON.parse(responseText)

    if (!data.audioContent) {
      return NextResponse.json(
        { error: "No audio content in response" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      audioContent: data.audioContent,
      usage: data.usage,
    })
  } catch (error) {
    console.error("TTS API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS generation failed" },
      { status: 500 }
    )
  }
}
