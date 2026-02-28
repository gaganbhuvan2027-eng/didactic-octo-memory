"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import streams from "@/lib/courses"
import { roles, companies } from "@/lib/companies"
import { PracticePrerequisiteModal } from "@/components/practice-prerequisite-modal"

// Interviewer options (Vivek removed - Claire only for demo)
const interviewers = [
  { id: "claire", name: "Claire", accent: "US English", avatar: "👩‍💼", image: "/interviewers/claire.png" },
]

// Duration options with credits
const durations = [
  { value: 5, label: "5 mins", credits: 1 },
  { value: 15, label: "15 mins", credits: 3 },
  { value: 30, label: "30 mins", credits: 6 },
]
// Test duration options (DSA/Aptitude - longer sessions)
const testDurations = [
  { value: 15, label: "15 mins", credits: 1 },
  { value: 30, label: "30 mins", credits: 2 },
  { value: 45, label: "45 mins", credits: 3 },
]

// Difficulty levels
const difficulties = [
  { id: "beginner", label: "Beginner" },
  { id: "pro", label: "Pro" },
  { id: "expert", label: "Expert" },
]

// Interview rounds for roles
const allRounds = [
  { id: "warmup", label: "Warm Up", subtitle: "NON TECHNICAL" },
  { id: "coding", label: "Coding", subtitle: "PROGRAMMING" },
  { id: "technical", label: "Role Related", subtitle: "TECHNICAL" },
  { id: "behavioral", label: "Behavioral", subtitle: "HR" },
]

// Course-specific rounds (only technical for regular courses)
const courseRoundsTechnicalOnly = [
  { id: "technical", label: "Technical", subtitle: "CONCEPTS" },
]

// Coding language options (shown when coding round is selected)
const codingLanguages = [
  { id: "Python", label: "Python" },
  { id: "JavaScript", label: "JavaScript" },
  { id: "Java", label: "Java" },
  { id: "C++", label: "C++" },
]

// DSA: only C++, Java, Python
const dsaLanguages = [
  { id: "C++", label: "C++" },
  { id: "Java", label: "Java" },
  { id: "Python", label: "Python" },
]

// Other interview types data
const otherInterviews: Record<string, { title: string; icon: string; description: string }> = {
  "hr-interview": { title: "HR Interview", icon: "🤝", description: "Behavioral questions, cultural fit, and soft skills" },
  "warmup": { title: "Warmup Interview", icon: "🔥", description: "Light practice to build confidence" },
  "salary-negotiation": { title: "Salary Negotiation", icon: "💰", description: "Master compensation negotiation" },
}

// Company rounds: Warm Up, HR Technical (no coding - coding is role-only)
const companyBaseRounds = [
  { id: "warmup", label: "Warm Up", subtitle: "NON TECHNICAL" },
  { id: "behavioral", label: "HR Technical", subtitle: "BEHAVIORAL" },
]

interface InterviewConfigModalProps {
  isOpen: boolean
  onClose: () => void
  type: "course" | "role" | "company" | "other"
  itemId: string
  roleId?: string
  isFull?: boolean
  roundType?: string
}

// Radix Dialog sometimes leaves body scroll-locked and pointer-events:none after close - force cleanup
function clearBodyScrollLock() {
  document.body.style.overflow = ""
  document.body.style.pointerEvents = "auto"
  document.body.removeAttribute("data-scroll-locked")
  document.body.removeAttribute("inert")
  document.documentElement.style.overflow = ""
  document.documentElement.style.pointerEvents = "auto"
  // Remove any leftover Radix overlay/portal that might block interaction
  document.querySelectorAll("[data-radix-dialog-overlay], [data-slot='dialog-overlay']").forEach((el) => {
    ;(el as HTMLElement).style.pointerEvents = "none"
    ;(el as HTMLElement).style.visibility = "hidden"
  })
}

export function InterviewConfigModal({ isOpen, onClose, type, itemId, roleId, isFull, roundType }: InterviewConfigModalProps) {
  const router = useRouter()

  // Force cleanup when modal closes or component unmounts - Radix RemoveScroll can leave body locked
  useEffect(() => {
    if (!isOpen) {
      clearBodyScrollLock()
      const t1 = setTimeout(clearBodyScrollLock, 50)
      const t2 = setTimeout(clearBodyScrollLock, 150)
      const t3 = setTimeout(clearBodyScrollLock, 300)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
      }
    }
    return () => clearBodyScrollLock() // Cleanup on unmount (e.g. navigation from /interview-config)
  }, [isOpen])

  // State - must be declared before any derived values that use them
  const [selectedSubcourses, setSelectedSubcourses] = useState<string[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [selectedRound, setSelectedRound] = useState<string>("technical")

  // Find the item data
  const stream = type === "course" ? streams.find(s => s.id === itemId) : null
  const effectiveRoleId = roleId || selectedRoleId
  const role = type === "role" ? roles.find(r => r.id === itemId) : (type === "company" && effectiveRoleId ? roles.find(r => r.id === effectiveRoleId) : null)
  const company = type === "company" ? companies.find(c => c.id === itemId) : null
  const otherInterview = type === "other" ? otherInterviews[itemId] : null

  const isTest = type === "course" && (itemId === "dsa" || itemId === "aptitude")
  const isAptitude = type === "course" && itemId === "aptitude"

  const title =
    type === "company" && effectiveRoleId && role
      ? `${role.name} at ${company?.name || ""}`
      : type === "company" && isFull
        ? `Full ${company?.name || ""} Interview`
        : type === "company" && roundType
          ? `${company?.name || ""} - ${roundType.charAt(0).toUpperCase() + roundType.slice(1)}`
          : stream?.title || (type === "role" ? role?.name : null) || company?.name || otherInterview?.title || "Interview"

  const [selectedDuration, setSelectedDuration] = useState<number>(5)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("beginner")
  const [selectedInterviewer, setSelectedInterviewer] = useState<string>("claire")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [showPrerequisite, setShowPrerequisite] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Python")
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false)
  const languageDropdownRef = useRef<HTMLDivElement>(null)
  
  // For tests, use "coding" round by default (hidden from UI)
  const effectiveRound = isTest ? "coding" : selectedRound
  
  // Get credits for selected duration (different for tests vs interviews)
  const durationOptions = isTest ? testDurations : durations
  const selectedCredits = durationOptions.find(d => d.value === selectedDuration)?.credits || 1

  // Pre-select first valid duration when switching to test (5 is invalid for tests)
  useEffect(() => {
    if (isTest && !durationOptions.some(d => d.value === selectedDuration)) {
      setSelectedDuration(durationOptions[0]?.value ?? 15)
    }
  }, [isTest, selectedDuration, durationOptions])

  // DSA: ensure selected language is one of C++, Java, Python
  const isDSA = type === "course" && itemId === "dsa"
  useEffect(() => {
    if (isDSA && !dsaLanguages.some((l) => l.id === selectedLanguage)) {
      setSelectedLanguage("C++")
    }
  }, [isDSA, selectedLanguage])
  
  // Reset subcourses when stream changes - select first by default
  useEffect(() => {
    if (stream?.subcourses[0]?.id) {
      setSelectedSubcourses([stream.subcourses[0].id])
    } else {
      setSelectedSubcourses([])
    }
  }, [stream])

  // Sync selectedRoleId when roleId prop changes (e.g. opened from company role link)
  useEffect(() => {
    if (type === "company" && roleId) {
      setSelectedRoleId(roleId)
    } else if (type !== "company") {
      setSelectedRoleId(null)
    }
  }, [type, roleId])
  
  // Determine which rounds to show based on type and course
  const getAvailableRounds = () => {
    if (type === "role") {
      // Only show rounds relevant to this role (exclude warmup and HR/behavioral)
      const roleRounds = role?.interviewRounds
      const excludedFromRole = ["warmup", "behavioral"]
      if (roleRounds?.length) {
        return allRounds.filter(
          (r) => roleRounds.includes(r.id) && !excludedFromRole.includes(r.id)
        )
      }
      return allRounds.filter((r) => !excludedFromRole.includes(r.id))
    }

    if (type === "company") {
      // Company: Warm Up + HR Technical only (no coding - coding is role-only)
      return companyBaseRounds
    }
    
    if (type === "other") {
      return []
    }
    
    // For courses (non-test): only technical round
    if (type === "course" && !isTest) {
      return courseRoundsTechnicalOnly
    }
    
    return []
  }
  
  const availableRounds = getAvailableRounds()

  // Default round for company: warmup, or roundType if coming from a specific round link
  useEffect(() => {
    if (type === "company" && availableRounds.length > 0) {
      const targetRound = roundType && availableRounds.some((r) => r.id === roundType) ? roundType : availableRounds[0].id
      const hasCurrent = availableRounds.some((r) => r.id === selectedRound)
      if (!hasCurrent || (roundType && selectedRound !== roundType)) setSelectedRound(targetRound)
    }
  }, [type, availableRounds, selectedRound, roundType])

  // For role: ensure selected round is in available (role-specific) rounds
  useEffect(() => {
    if (type === "role" && availableRounds.length > 0) {
      const hasCurrent = availableRounds.some((r) => r.id === selectedRound)
      const targetRound = roundType && availableRounds.some((r) => r.id === roundType) ? roundType : availableRounds[0].id
      if (!hasCurrent || (roundType && selectedRound !== roundType)) setSelectedRound(targetRound)
    }
  }, [type, availableRounds, selectedRound, roundType])

  // For course (non-test): only technical round - ensure it's selected
  useEffect(() => {
    if (type === "course" && !isTest && availableRounds.length > 0) {
      const hasCurrent = availableRounds.some((r) => r.id === selectedRound)
      if (!hasCurrent) setSelectedRound(availableRounds[0].id)
    }
  }, [type, isTest, availableRounds, selectedRound])

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target as Node)) {
        setLanguageDropdownOpen(false)
      }
    }
    if (languageDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [languageDropdownOpen])
  
  const handleStartPractice = () => {
    // For DSA/Aptitude tests, skip prerequisite (no mic/video needed)
    if (isTest) {
      handleStartInterview()
      return
    }
    setShowPrerequisite(true)
  }
  
  const handleStartInterview = () => {
    const params = new URLSearchParams()
    
    if (type === "course" && selectedSubcourses.length > 0) {
      if (selectedSubcourses.length > 1) {
        params.set("topics", selectedSubcourses.join(","))
      } else {
        params.set("subcourse", selectedSubcourses[0])
      }
    }
    if (type !== "other") {
      params.set("round", effectiveRound)
    }
    if (effectiveRound === "coding" && !isAptitude && (type === "role" || isDSA)) {
      params.set("language", selectedLanguage)
    }
    params.set("duration", selectedDuration.toString())
    params.set("difficulty", selectedDifficulty)
    if (!isTest) {
      params.set("interviewer", selectedInterviewer)
      params.set("audio", audioEnabled.toString())
      params.set("video", videoEnabled.toString())
    }
    
    let path = ""
    if (type === "course") {
      const subcoursePath = selectedSubcourses.length > 1 ? "multi" : selectedSubcourses[0]
      path = `/interview/course/${itemId}/${subcoursePath}`
    } else if (type === "other") {
      path = `/interview/other/${itemId}`
    } else if (type === "role") {
      path = `/interview/role/${itemId}/${effectiveRound}`
    } else if (type === "company") {
      if (effectiveRoleId) {
        path = `/interview/company/${itemId}/role/${effectiveRoleId}`
      } else {
        const roundSlug = isFull ? selectedRound : (roundType || selectedRound)
        path = `/interview/company/${itemId}/${roundSlug}`
      }
    }
    
    const interviewUrl = `${path}?${params.toString()}`
    setShowPrerequisite(false)
    // Navigate to prepare page - do NOT call onClose() here as it would trigger
    // router.back() or router.push('/interviews') and override our navigation
    router.push(`/interview/prepare?next=${encodeURIComponent(interviewUrl)}`)
  }
  
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          clearBodyScrollLock()
          onClose()
          requestAnimationFrame(() => clearBodyScrollLock())
          setTimeout(clearBodyScrollLock, 100)
        }
      }}
    >
      <DialogContent className="sm:max-w-[900px] md:max-w-[980px] lg:max-w-[1050px] p-0 gap-0 bg-white rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 py-5 pb-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isTest ? "Test Details" : "Interview Details"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Job Role / Title Display */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <p className="font-medium text-gray-900">{title}</p>
            {type === "company" && (
              <p className="text-sm text-gray-500 mt-1">
                {effectiveRoleId ? "Role Related" : isFull ? "Full Interview" : roundType ? `${roundType.charAt(0).toUpperCase() + roundType.slice(1)} Round` : "Company Interview"}
              </p>
            )}
          </div>

          {/* Select Subcourse / Topics (for courses only) */}
          {type === "course" && stream && (
            <div>
              <Label className="text-sm font-medium text-gray-900 mb-3 block">
                {isTest ? "Topics" : "Select Topic"} <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {stream.subcourses.map((subcourse) => {
                  const isSelected = selectedSubcourses.includes(subcourse.id)
                  return (
                    <button
                      key={subcourse.id}
                      onClick={() => {
                        setSelectedSubcourses((prev) => {
                          if (isSelected) {
                            // Keep at least one selected
                            if (prev.length <= 1) return prev
                            return prev.filter((id) => id !== subcourse.id)
                          }
                          return [...prev, subcourse.id]
                        })
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg text-sm font-medium transition-all border-2 min-w-[88px]",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                      )}
                    >
                      {subcourse.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Select Round (not shown for "other" or test type) */}
          {availableRounds.length > 0 && !isTest && (
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Select Round <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {availableRounds.map((round) => (
                <button
                  key={round.id}
                  onClick={() => setSelectedRound(round.id)}
                  className={cn(
                    "px-5 py-3 rounded-lg text-sm font-medium transition-all border-2 flex flex-col items-center min-w-[110px]",
                    selectedRound === round.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  )}
                >
                  <span>{round.label}</span>
                  <span className={cn(
                    "text-[10px] mt-0.5 uppercase",
                    selectedRound === round.id ? "text-blue-200" : "text-gray-400"
                  )}>
                    {round.subtitle}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}
          
          {/* Coding Language: role coding (all 4) or DSA (C++, Java, Python only) */}
          {effectiveRound === "coding" && !isAptitude && (type === "role" || isDSA) && (
          <div ref={languageDropdownRef} className="relative">
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Coding Language <span className="text-red-500">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setLanguageDropdownOpen((prev) => !prev)}
              className={cn(
                "w-full px-4 py-3 rounded-lg text-sm font-medium transition-all border-2 text-left flex items-center justify-between",
                "bg-white border-gray-300 hover:border-blue-400",
                languageDropdownOpen && "border-blue-500 ring-2 ring-blue-200"
              )}
            >
              <span className={selectedLanguage ? "text-gray-900" : "text-gray-400"}>
                {selectedLanguage || "Select Coding Language"}
              </span>
              <svg
                className={cn("w-4 h-4 text-gray-500 transition-transform", languageDropdownOpen && "rotate-180")}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {languageDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 flex flex-col gap-0.5 rounded-md bg-white py-1 shadow-sm">
                {(isDSA ? dsaLanguages : codingLanguages).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang.id)
                      setLanguageDropdownOpen(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 rounded text-left text-sm",
                      selectedLanguage === lang.id
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
          
          {/* Duration */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              {isTest ? "Test Duration" : "Interview Duration"} <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {(isTest ? testDurations : durations).map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  className={cn(
                    "px-5 py-3 rounded-lg text-sm font-medium transition-all border-2 min-w-[100px]",
                    selectedDuration === duration.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  )}
                >
                  {duration.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedCredits} {selectedCredits === 1 ? "credit" : "credits"}
            </p>
          </div>
          
          {/* Difficulty Level */}
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              {isTest ? "Difficulty" : "Difficulty Level"} <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.id}
                  onClick={() => setSelectedDifficulty(difficulty.id)}
                  className={cn(
                    "px-5 py-3 rounded-lg text-sm font-medium transition-all border-2 min-w-[100px]",
                    selectedDifficulty === difficulty.id
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  )}
                >
                  {difficulty.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Select Your Interviewer (not shown for tests) */}
          {!isTest && (
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Select Your Interviewer <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {interviewers.map((interviewer) => (
                <button
                  key={interviewer.id}
                  onClick={() => setSelectedInterviewer(interviewer.id)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-xl border-2 transition-all min-w-[110px]",
                    selectedInterviewer === interviewer.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-400"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-2 overflow-hidden",
                    selectedInterviewer === interviewer.id ? "ring-2 ring-blue-600" : "",
                    "bg-gray-100"
                  )}>
                    {interviewer.image ? (
                      <img
                        src={interviewer.image}
                        alt={interviewer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{interviewer.avatar}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{interviewer.name}</span>
                  <span className="text-[10px] text-gray-500">{interviewer.accent}</span>
                </button>
              ))}
            </div>
          </div>
          )}
          
          {/* Practice Settings (not shown for tests) */}
          {!isTest && (
          <div>
            <Label className="text-sm font-medium text-gray-900 mb-3 block">
              Practice Settings <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="audio" 
                  checked={audioEnabled}
                  onCheckedChange={(checked) => setAudioEnabled(checked as boolean)}
                  className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="audio" className="text-sm text-gray-700 cursor-pointer">Audio</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="video" 
                  checked={videoEnabled}
                  onCheckedChange={(checked) => setVideoEnabled(checked as boolean)}
                  className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <Label htmlFor="video" className="text-sm text-gray-700 cursor-pointer">Video</Label>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Note: Video will be deleted after 30 mins.</p>
          </div>
          )}

        </div>
        
        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-100">
          <Button
            onClick={handleStartPractice}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg"
            disabled={type === "course" && selectedSubcourses.length === 0}
          >
            {isTest ? "START TEST" : "START PRACTICE"}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            CANCEL
          </Button>
        </div>
      </DialogContent>
      
      {/* Practice Prerequisite Modal */}
      <PracticePrerequisiteModal
        isOpen={showPrerequisite}
        onClose={() => setShowPrerequisite(false)}
        onStartInterview={handleStartInterview}
      />
    </Dialog>
  )
}
