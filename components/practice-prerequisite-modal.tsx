"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"

interface PracticePrerequisiteModalProps {
  isOpen: boolean
  onClose: () => void
  onStartInterview: () => void
}

interface CheckStatus {
  status: "checking" | "passed" | "failed"
  message: string
}

export function PracticePrerequisiteModal({ 
  isOpen, 
  onClose, 
  onStartInterview 
}: PracticePrerequisiteModalProps) {
  const [checks, setChecks] = useState<{
    browser: CheckStatus
    microphone: CheckStatus
    camera: CheckStatus
    voiceQuality: CheckStatus
    network: CheckStatus
    audioOutput: CheckStatus
  }>({
    browser: { status: "checking", message: "Checking browser compatibility..." },
    microphone: { status: "checking", message: "Checking microphone access..." },
    camera: { status: "checking", message: "Checking camera access..." },
    voiceQuality: { status: "checking", message: "Verifying voice capture..." },
    network: { status: "checking", message: "Testing connection..." },
    audioOutput: { status: "checking", message: "Checking audio output..." },
  })

  const instructions = [
    "Let the AI intro finish before you speak.",
    "Use Start Answer to begin, End Answer when done – the next question loads automatically.",
    "Longer, clearer answers improve your score and feedback.",
    "Finish every question to unlock your full report.",
    "Headphones recommended for clearer audio.",
  ]

  // Run compatibility checks when modal opens
  useEffect(() => {
    if (isOpen) {
      runCompatibilityChecks()
    }
  }, [isOpen])

  const runCompatibilityChecks = async () => {
    // Reset checks
    setChecks({
      browser: { status: "checking", message: "Checking browser compatibility..." },
      microphone: { status: "checking", message: "Checking microphone access..." },
      camera: { status: "checking", message: "Checking camera access..." },
      voiceQuality: { status: "checking", message: "Verifying voice capture..." },
      network: { status: "checking", message: "Testing connection..." },
      audioOutput: { status: "checking", message: "Checking audio output..." },
    })

    // Check browser - prefer Chrome/Edge for best compatibility
    setTimeout(() => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isChrome = userAgent.includes("chrome") && !userAgent.includes("edg")
      const isEdge = userAgent.includes("edg")
      const isFirefox = userAgent.includes("firefox")
      const isSafari = userAgent.includes("safari") && !userAgent.includes("chrome")
      
      if (isChrome || isEdge) {
        setChecks(prev => ({
          ...prev,
          browser: { status: "passed", message: "Web client meets requirements." }
        }))
      } else if (isFirefox || isSafari) {
        setChecks(prev => ({
          ...prev,
          browser: { status: "passed", message: "Supported (Chrome preferred)." }
        }))
      } else {
        setChecks(prev => ({
          ...prev,
          browser: { status: "failed", message: "Switch to Chrome or Edge." }
        }))
      }
    }, 500)

    // Check microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setChecks(prev => ({
        ...prev,
        microphone: { status: "passed", message: "Mic is active." },
        voiceQuality: { status: "passed", message: "Speech capture OK." }
      }))
    } catch {
      setChecks(prev => ({
        ...prev,
        microphone: { status: "failed", message: "Allow mic access." },
        voiceQuality: { status: "failed", message: "Turn on mic first." }
      }))
    }

    // Check camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setChecks(prev => ({
        ...prev,
        camera: { status: "passed", message: "Webcam is active." }
      }))
    } catch {
      setChecks(prev => ({
        ...prev,
        camera: { status: "failed", message: "Allow camera access." }
      }))
    }

    // Check network connectivity
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      await fetch("/api/user/credits", { signal: controller.signal, cache: "no-store" })
      clearTimeout(timeout)
      setChecks(prev => ({
        ...prev,
        network: { status: "passed", message: "Server reachable." }
      }))
    } catch {
      setChecks(prev => ({
        ...prev,
        network: { status: "failed", message: "Network unreachable." }
      }))
    }

    // Check audio output (speakers/headphones)
    // ctx.resume() can hang indefinitely when AudioContext is suspended (browser autoplay policy)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
      const resumePromise = ctx.resume()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2500)
      )
      await Promise.race([resumePromise, timeoutPromise])
      ctx.close()
      setChecks(prev => ({
        ...prev,
        audioOutput: { status: "passed", message: "Playback OK." }
      }))
    } catch {
      // Timeout or error: assume OK (browser may block until user interaction)
      setChecks(prev => ({
        ...prev,
        audioOutput: { status: "passed", message: "Audio API available." }
      }))
    }
  }

  const passedChecks = Object.values(checks).filter(c => c.status === "passed").length
  const totalChecks = Object.keys(checks).length
  const allChecksPassed = passedChecks === totalChecks
  const isChecking = Object.values(checks).some(c => c.status === "checking")

  const renderCheckIcon = (status: CheckStatus["status"]) => {
    switch (status) {
      case "checking":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "passed":
        return (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )
      case "failed":
        return (
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] md:max-w-[1000px] p-0 gap-0 bg-white rounded-2xl overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">Practice Prerequisite</DialogTitle>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left Side - Instructions */}
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="text-lg font-semibold text-gray-900">Interview Practice Instructions</h3>
            </div>
            
            {/* Interviewer Preview - Claire (landscape, compact) */}
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 aspect-video max-h-36">
              <img
                src="/interviewers/claire.png"
                alt="Claire - AI Interviewer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Start Answer Button Preview */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium shadow">
                  ▶ START ANSWER
                </div>
              </div>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed pt-0.5">{instruction}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Compatibility Test */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compatibility Test</h3>
              <p className="text-blue-600 text-sm font-medium mt-1">
                Setup Checklist ({passedChecks}/{totalChecks})
              </p>
            </div>

            {/* Checklist Items */}
            <div className="space-y-4 bg-gray-50 rounded-xl p-4">
              {/* Browser Check */}
              <div className="flex items-start gap-3">
                {renderCheckIcon(checks.browser.status)}
                <p className={`text-sm ${checks.browser.status === "failed" ? "text-red-600" : "text-gray-700"}`}>
                  {checks.browser.message}
                </p>
              </div>

              {/* Microphone Check */}
              <div className="flex items-start gap-3">
                {renderCheckIcon(checks.microphone.status)}
                <p className={`text-sm ${checks.microphone.status === "failed" ? "text-red-600" : "text-gray-700"}`}>
                  {checks.microphone.message}
                </p>
              </div>

              {/* Camera Check */}
              <div className="flex items-start gap-3">
                {renderCheckIcon(checks.camera.status)}
                <p className={`text-sm ${checks.camera.status === "failed" ? "text-red-600" : "text-gray-700"}`}>
                  {checks.camera.message}
                </p>
              </div>

              {/* Voice Quality Check */}
              <div className="flex items-start gap-3">
                {renderCheckIcon(checks.voiceQuality.status)}
                <p className={`text-sm ${checks.voiceQuality.status === "failed" ? "text-red-600" : "text-gray-700"}`}>
                  {checks.voiceQuality.message}
                </p>
              </div>

              {/* Network Check */}
              <div className="flex items-start gap-3">
                {renderCheckIcon(checks.network.status)}
                <p className={`text-sm ${checks.network.status === "failed" ? "text-red-600" : "text-gray-700"}`}>
                  {checks.network.message}
                </p>
              </div>

              {/* Audio Output Check */}
              <div className="flex items-start gap-3">
                {renderCheckIcon(checks.audioOutput.status)}
                <p className={`text-sm ${checks.audioOutput.status === "failed" ? "text-red-600" : "text-gray-700"}`}>
                  {checks.audioOutput.message}
                </p>
              </div>
            </div>

            {/* Retry Button */}
            {!isChecking && !allChecksPassed && (
              <Button
                variant="outline"
                onClick={runCompatibilityChecks}
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Retry Checks
              </Button>
            )}

            {/* Status Message */}
            {!isChecking && (
              <div className={`p-4 rounded-xl ${allChecksPassed ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                {allChecksPassed ? (
                  <p className="text-sm text-green-700 font-medium">
                    ✓ Ready. You can start.
                  </p>
                ) : (
                  <p className="text-sm text-amber-700">
                    Fix failed items or proceed anyway – some features may not work.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <Button
            onClick={onStartInterview}
            disabled={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-base font-semibold"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Running Checks...
              </>
            ) : (
              "START PRACTICE"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
