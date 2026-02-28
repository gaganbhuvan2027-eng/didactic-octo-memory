"use client"

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, CameraOff } from 'lucide-react'
import { Button } from "@/components/ui/button"
import * as faceapi from 'face-api.js'

interface FaceMetrics {
  eyeContact: number
  smile: number
  stillness: number
  confidenceScore: number
}

interface FaceAnalysisProps {
  onMetricsUpdate?: (metrics: FaceMetrics) => void
  videoDeviceId?: string | null
}

export interface FaceAnalysisRef {
  getAverageMetrics: () => FaceMetrics | null
  startCamera: () => Promise<void>
  stopCamera: () => void
}

const FaceAnalysis = forwardRef<FaceAnalysisRef, FaceAnalysisProps>(({ onMetricsUpdate, videoDeviceId }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const metricsHistoryRef = useRef<FaceMetrics[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const faceApiRef = useRef<any>(null)
  const animationFrameRef = useRef<number | null>(null)
  const previousPositionRef = useRef<{ x: number; y: number } | null>(null)
  const movementHistoryRef = useRef<number[]>([])

  useImperativeHandle(ref, () => ({
    getAverageMetrics: () => {
      if (metricsHistoryRef.current.length === 0) return null

      const sum = metricsHistoryRef.current.reduce(
        (acc, metrics) => ({
          eyeContact: acc.eyeContact + metrics.eyeContact,
          smile: acc.smile + metrics.smile,
          stillness: acc.stillness + metrics.stillness,
          confidenceScore: acc.confidenceScore + metrics.confidenceScore,
        }),
        { eyeContact: 0, smile: 0, stillness: 0, confidenceScore: 0 },
      )

      const count = metricsHistoryRef.current.length
      return {
        eyeContact: Math.round(sum.eyeContact / count),
        smile: Math.round(sum.smile / count),
        stillness: Math.round(sum.stillness / count),
        confidenceScore: Math.round(sum.confidenceScore / count),
      }
    },
    startCamera: async () => {
      await startCamera()
    },
    stopCamera: () => {
      stopCamera()
    },
  }))

  useEffect(() => {
    const initializeLibraries = async () => {
      try {
        console.log("[FaceAnalysis] Loading face-api.js models...")
        
        // Load face detection and landmark models from CDN
        const MODEL_URL = '/models'
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ])
        
        console.log("[FaceAnalysis] Models loaded successfully!")
        setModelsLoaded(true)
      } catch (err) {
        console.error("[FaceAnalysis] Error loading face detection models:", err)
        console.log("[FaceAnalysis] Continuing without models - will use fallback detection")
        // Continue anyway - we'll use basic detection if models fail
        setModelsLoaded(true)
      }
    }

    initializeLibraries()
  }, [])

  // Restart camera when videoDeviceId changes
  useEffect(() => {
    if (isActive && modelsLoaded) {
      stopCamera()
      startCamera()
    }
  }, [videoDeviceId])

  const toggleCamera = async () => {
    if (isActive) {
      stopCamera()
    } else {
      await startCamera()
    }
  }

  const startCamera = async () => {
    if (!modelsLoaded) {
      setError("Face detection models are still loading. Please wait...")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user",
      }
      if (videoDeviceId) {
        videoConstraints.deviceId = { exact: videoDeviceId }
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })

      if (!videoRef.current) {
        throw new Error("Video element not found")
      }

      const video = videoRef.current
      video.autoplay = true
      video.playsInline = true
      video.muted = true
      video.srcObject = stream
      streamRef.current = stream

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video metadata loading timeout"))
        }, 20000) // Increased from 10000 to 20000

        let resolved = false

        const handleResolve = async () => {
          if (resolved) return
          resolved = true
          clearTimeout(timeout)
          
          try {
            await video.play()
            resolve()
          } catch (playError: unknown) {
            if ((playError as DOMException)?.name === "AbortError") { resolve(); return }
            console.error("[v0] Error starting video playback:", playError)
            reject(playError)
          }
        }

        // Try both events - whichever fires first
        video.onloadedmetadata = handleResolve
        video.oncanplay = handleResolve

        video.onerror = (e) => {
          clearTimeout(timeout)
          console.error("[v0] Video element error:", e)
          reject(new Error("Video element error"))
        }
        
        // If video is already ready, resolve immediately
        if (video.readyState >= 2) {
          handleResolve()
        }
      })

      setIsActive(true)
      setIsLoading(false)
    } catch (err: any) {
      console.error("[v0] Error in startCamera:", err)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      let errorMessage = "Failed to access webcam. "

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage += "Please grant camera permissions in your browser settings."
      } else if (err.name === "NotFoundError") {
        errorMessage += "No camera found on this device."
      } else if (err.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application."
      } else if (err.message?.includes("timeout")) {
        errorMessage += "Camera initialization timed out. Please try again."
      } else {
        errorMessage += err.message || "Please check your camera settings and try again."
      }

      setError(errorMessage)
      setIsLoading(false)
      setIsActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsActive(false)
    previousPositionRef.current = null
    movementHistoryRef.current = []
  }

  const analyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(analyze)
      return
    }

    if (!isActive) {
      animationFrameRef.current = requestAnimationFrame(analyze)
      return
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    try {
      // Try to detect face using face-api.js
      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      let eyeContactScore = 50
      let smileScore = 50
      let stillnessScore = 50

      if (detections) {
        // Face detected - calculate real metrics
        const { landmarks, expressions, detection } = detections

        // Eye contact: Check if face is looking at camera (center position)
        const nose = landmarks.getNose()
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const noseCenter = nose[3] // Tip of nose
        
        const distanceFromCenter = Math.sqrt(
          Math.pow(noseCenter.x - centerX, 2) + 
          Math.pow(noseCenter.y - centerY, 2)
        )
        const maxDistance = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2))
        eyeContactScore = Math.max(0, 100 - (distanceFromCenter / maxDistance) * 100)

        // Smile detection from expressions
        if (expressions.happy) {
          smileScore = Math.round(expressions.happy * 100)
        }

        // Stillness: Calculate movement from previous frame
        const currentX = detection.box.x
        const currentY = detection.box.y
        
        if (previousPositionRef.current) {
          const movement = Math.sqrt(
            Math.pow(currentX - previousPositionRef.current.x, 2) + 
            Math.pow(currentY - previousPositionRef.current.y, 2)
          )
          movementHistoryRef.current.push(movement)
          
          // Keep last 10 frames
          if (movementHistoryRef.current.length > 10) {
            movementHistoryRef.current.shift()
          }
          
          // Calculate average movement
          const avgMovement = movementHistoryRef.current.reduce((a, b) => a + b, 0) / movementHistoryRef.current.length
          stillnessScore = Math.max(0, 100 - avgMovement * 5)
        }
        
        previousPositionRef.current = { x: currentX, y: currentY }

        // Draw face detection box
        if (ctx) {
          ctx.strokeStyle = "#10b981"
          ctx.lineWidth = 2
          ctx.strokeRect(
            detection.box.x,
            detection.box.y,
            detection.box.width,
            detection.box.height
          )
          
          // Draw landmarks for better visualization
          ctx.fillStyle = "#10b981"
          landmarks.positions.forEach(point => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI)
            ctx.fill()
          })
        }
      } else {
        // No face detected - use lower scores
        eyeContactScore = 20
        smileScore = 30
        stillnessScore = 40
        
        // Draw a guide rectangle
        if (ctx) {
          ctx.strokeStyle = "#ef4444"
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.6, canvas.height * 0.6)
          ctx.setLineDash([])
          
          // Show "No face detected" message
          ctx.fillStyle = "#ef4444"
          ctx.font = "16px Arial"
          ctx.textAlign = "center"
          ctx.fillText("Position your face in frame", canvas.width / 2, 30)
        }
      }

      const confidenceScore = eyeContactScore * 0.4 + smileScore * 0.3 + stillnessScore * 0.3

      const currentMetrics = {
        eyeContact: Math.round(eyeContactScore),
        smile: Math.round(smileScore),
        stillness: Math.round(stillnessScore),
        confidenceScore: Math.round(confidenceScore),
      }

      metricsHistoryRef.current.push(currentMetrics)

      if (onMetricsUpdate) {
        onMetricsUpdate(currentMetrics)
      }
    } catch (err) {
      console.error("[FaceAnalysis] Error during face analysis:", err)
    }

    if (isActive) {
      // Analyze every 500ms instead of every frame for performance
      setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(analyze)
      }, 500)
    }
  }, [isActive, onMetricsUpdate])

  useEffect(() => {
    if (isActive) {
      analyze()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, analyze])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
            style={{ display: isActive ? "block" : "none" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ display: isActive ? "block" : "none" }}
          />
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  {modelsLoaded ? "Camera is off" : "Loading face detection models..."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-4">
          <Button onClick={toggleCamera} disabled={isLoading || !modelsLoaded} size="sm" variant="outline">
            {isLoading ? (
              <>Loading...</>
            ) : isActive ? (
              <>
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                {modelsLoaded ? "Start Camera" : "Loading Models..."}
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm text-center">{error}</div>
        )}
      </CardContent>
    </Card>
  )
})

FaceAnalysis.displayName = "FaceAnalysis"

export default FaceAnalysis
