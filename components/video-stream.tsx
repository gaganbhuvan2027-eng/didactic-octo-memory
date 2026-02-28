"use client"

import { useEffect, useRef, useState } from "react"

export default function VideoStream() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  useEffect(() => {
    const startVideo = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setIsSupported(false)
          setError("Camera access not supported in this environment")
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setHasPermission(true)
          setError(null)
        }
      } catch (err: any) {
        setIsSupported(false)
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission denied. Please enable camera access."
            : "Camera not available. Continuing in demo mode.",
        )
        console.log("[v0] Camera error:", err?.message)
      }
    }

    startVideo()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
      {hasPermission && isSupported ? (
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      ) : (
        <div className="text-center text-white p-6 z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </div>
          <p className="font-semibold text-lg mb-2">Camera Not Available</p>
          <p className="text-sm text-gray-400 mb-4">{error || "Camera access required to continue"}</p>
          <p className="text-xs text-gray-500">You can still participate using audio responses</p>
        </div>
      )}
    </div>
  )
}
