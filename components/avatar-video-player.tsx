"use client"

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { getAvatarUrls } from "@/lib/avatar-cache"

export type AvatarState = "intro" | "speaking" | "idle"

export interface AvatarVideoPlayerRef {
  playIntro: () => Promise<void>
  playSpeaking: () => void
  playIdle: () => void
  stopAll: () => void
  getCurrentState: () => AvatarState
}

interface AvatarVideoPlayerProps {
  onIntroEnd?: () => void
  className?: string
  avatarId?: string
}

const AvatarVideoPlayer = forwardRef<AvatarVideoPlayerRef, AvatarVideoPlayerProps>(
  ({ onIntroEnd, className = "", avatarId = "claire" }, ref) => {
    // Use cached blob URLs if preloaded during prepare; else fall back to paths
    const videos = getAvatarUrls(avatarId)
    const introVideoRef = useRef<HTMLVideoElement>(null)
    const speakingVideoRef = useRef<HTMLVideoElement>(null)
    const idleVideoRef = useRef<HTMLVideoElement>(null)
    const currentStateRef = useRef<AvatarState>("idle")

    const hideAllVideos = useCallback(() => {
      if (introVideoRef.current) {
        introVideoRef.current.style.display = "none"
        introVideoRef.current.pause()
        introVideoRef.current.currentTime = 0
      }
      if (speakingVideoRef.current) {
        speakingVideoRef.current.style.display = "none"
        speakingVideoRef.current.pause()
      }
      if (idleVideoRef.current) {
        idleVideoRef.current.style.display = "none"
        idleVideoRef.current.pause()
      }
    }, [])

    const playIntro = useCallback(async () => {
      hideAllVideos()
      currentStateRef.current = "intro"
      
      if (introVideoRef.current) {
        introVideoRef.current.muted = false
        introVideoRef.current.style.display = "block"
        introVideoRef.current.currentTime = 0
        
        return new Promise<void>((resolve) => {
          const handleEnded = () => {
            introVideoRef.current?.removeEventListener("ended", handleEnded)
            if (introVideoRef.current) introVideoRef.current.muted = true // Mute after intro so it never plays again
            onIntroEnd?.()
            resolve()
          }
          
          introVideoRef.current?.addEventListener("ended", handleEnded)
          introVideoRef.current?.play().catch((e) => { if (e?.name !== "AbortError") console.error(e) })
        })
      }
      
      return Promise.resolve()
    }, [hideAllVideos, onIntroEnd])

    const playSpeaking = useCallback(() => {
      hideAllVideos()
      currentStateRef.current = "speaking"
      
      if (speakingVideoRef.current) {
        speakingVideoRef.current.style.display = "block"
        speakingVideoRef.current.currentTime = 0
        speakingVideoRef.current.loop = true
        speakingVideoRef.current.play().catch((e) => { if (e?.name !== "AbortError") console.error(e) })
      }
    }, [hideAllVideos])

    const playIdle = useCallback(() => {
      hideAllVideos()
      currentStateRef.current = "idle"
      
      if (idleVideoRef.current) {
        idleVideoRef.current.style.display = "block"
        idleVideoRef.current.loop = true
        idleVideoRef.current.play().catch((e) => { if (e?.name !== "AbortError") console.error(e) })
      }
    }, [hideAllVideos])

    const stopAll = useCallback(() => {
      hideAllVideos()
      currentStateRef.current = "idle"
    }, [hideAllVideos])

    const getCurrentState = useCallback(() => {
      return currentStateRef.current
    }, [])

    useImperativeHandle(ref, () => ({
      playIntro,
      playSpeaking,
      playIdle,
      stopAll,
      getCurrentState,
    }))

    useEffect(() => {
      // Start with idle video on mount
      playIdle()
    }, [playIdle])

    return (
      <div className={`relative w-full h-full bg-white rounded-2xl overflow-hidden ${className}`}>
        {/* Solid background fallback for devices with video codec issues */}
        <div className="absolute inset-0 bg-white" />
        
        {/* Intro Video - plays once at start with audio */}
        <video
          ref={introVideoRef}
          src={videos.intro}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ display: "none", backgroundColor: "#ffffff" }}
          playsInline
          preload="auto"
        />
        
        {/* Speaking Video - loops while AI is speaking (no audio, TTS provides audio) */}
        <video
          ref={speakingVideoRef}
          src={videos.speaking}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ display: "none", backgroundColor: "#ffffff" }}
          playsInline
          muted
          loop
          preload="auto"
        />
        
        {/* Idle Video - loops when avatar stares (user speaking or waiting) */}
        <video
          ref={idleVideoRef}
          src={videos.idle}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ backgroundColor: "#ffffff" }}
          playsInline
          muted
          loop
          preload="auto"
        />
      </div>
    )
  }
)

AvatarVideoPlayer.displayName = "AvatarVideoPlayer"

export default AvatarVideoPlayer
