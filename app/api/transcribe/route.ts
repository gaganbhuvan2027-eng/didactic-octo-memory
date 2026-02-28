import { NextRequest, NextResponse } from "next/server"

const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      console.error("[Groq STT API] API key is not set")
      return NextResponse.json(
        { error: "Groq API key is not configured" },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get("file") as Blob | null

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      )
    }

    console.log("[Groq STT API] Received audio file, size:", audioFile.size, "bytes")

    // Forward the request to Groq API with optimized parameters
    const groqFormData = new FormData()
    groqFormData.append("file", audioFile, "audio.webm") // Ensure correct MIME type for Groq
    groqFormData.append("model", "whisper-large-v3-turbo") // Fastest Whisper model
    groqFormData.append("language", "en")
    groqFormData.append("response_format", "json")
    groqFormData.append("temperature", "0") // More deterministic = faster processing

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: groqFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Groq STT API] Error from Groq:", response.status, errorText)
      return NextResponse.json(
        { error: "Transcription failed", details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[Groq STT API] Transcription successful:", data.text?.substring(0, 50) + "...")

    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error("[Groq STT API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
