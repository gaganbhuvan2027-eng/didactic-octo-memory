"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, GraduationCap, Briefcase, Code } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  // Redirect to dashboard if user has already completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/auth")
          return
        }
        const { data: profile } = await supabase
          .from("users")
          .select("preferences")
          .eq("id", user.id)
          .maybeSingle()
        const prefs = profile?.preferences as { onboarding_completed?: boolean } | null
        if (prefs?.onboarding_completed) {
          router.replace("/dashboard")
          return
        }
      } catch {
        // Ignore - let user continue to onboarding
      } finally {
        setCheckingOnboarding(false)
      }
    }
    checkOnboarding()
  }, [router])

  useEffect(() => {
    const ensureCredits = async () => {
      try {
        await fetch("/api/user/ensure-credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      } catch {
        // Ignore - credits will be granted on first use if needed
      }
    }
    ensureCredits()
  }, [])

  // Profile data
  const [profileData, setProfileData] = useState({
    careerStage: "", // "student", "recent_graduate", "professional", "career_changer"
    yearsOfExperience: "",
    educationLevel: "",
    skills: [] as string[],
    targetRole: "",
  })

  const careerStages = [
    {
      id: "student",
      title: "Student",
      description: "Currently pursuing a degree",
      icon: GraduationCap,
    },
    {
      id: "recent_graduate",
      title: "Recent Graduate",
      description: "Graduated within the last 2 years",
      icon: GraduationCap,
    },
    {
      id: "professional",
      title: "Professional",
      description: "Working in the industry",
      icon: Briefcase,
    },
    {
      id: "career_changer",
      title: "Career Changer",
      description: "Transitioning to a new field",
      icon: Code,
    },
  ]

  const experienceLevels = [
    { id: "0", label: "No experience", description: "Just starting out" },
    { id: "0-1", label: "Less than 1 year", description: "Entry level" },
    { id: "1-3", label: "1-3 years", description: "Junior level" },
    { id: "3-5", label: "3-5 years", description: "Mid level" },
    { id: "5-10", label: "5-10 years", description: "Senior level" },
    { id: "10+", label: "10+ years", description: "Expert level" },
  ]

  const educationLevels = [
    { id: "high_school", label: "High School", icon: "🎓" },
    { id: "associate", label: "Associate Degree", icon: "📚" },
    { id: "bachelor", label: "Bachelor's Degree", icon: "🎓" },
    { id: "master", label: "Master's Degree", icon: "📖" },
    { id: "phd", label: "PhD", icon: "🔬" },
    { id: "bootcamp", label: "Bootcamp/Self-taught", icon: "💻" },
  ]

  const commonSkills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "TypeScript",
    "SQL",
    "MongoDB",
    "AWS",
    "Docker",
    "Git",
    "HTML/CSS",
    "C++",
    "Go",
    "Rust",
    "Machine Learning",
    "Data Analysis",
    "System Design",
    "API Development",
    "Testing",
  ]

  const targetRoles = [
    { id: "frontend", label: "Frontend Developer", icon: "🎨" },
    { id: "backend", label: "Backend Developer", icon: "⚙️" },
    { id: "fullstack", label: "Full Stack Developer", icon: "🔧" },
    { id: "mobile", label: "Mobile Developer", icon: "📱" },
    { id: "devops", label: "DevOps Engineer", icon: "🚀" },
    { id: "data", label: "Data Scientist/Analyst", icon: "📊" },
    { id: "ml", label: "ML/AI Engineer", icon: "🤖" },
    { id: "qa", label: "QA Engineer", icon: "✅" },
    { id: "security", label: "Security Engineer", icon: "🔒" },
    { id: "product", label: "Product Manager", icon: "📋" },
  ]

  const toggleSkill = (skill: string) => {
    if (profileData.skills.includes(skill)) {
      setProfileData({
        ...profileData,
        skills: profileData.skills.filter((s) => s !== skill),
      })
    } else {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, skill],
      })
    }
  }

  const handleSkipAll = async () => {
    setLoading(true)
    try {
      await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })
      window.location.href = "/dashboard"
    } catch {
      window.location.href = "/dashboard"
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        window.location.href = "/dashboard"
      } else {
        console.error("Failed to save onboarding data")
      }
    } catch (error) {
      console.error("Error saving onboarding data:", error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return profileData.careerStage !== ""
      case 2:
        return profileData.yearsOfExperience !== ""
      case 3:
        return profileData.educationLevel !== ""
      case 4:
        return profileData.skills.length > 0
      case 5:
        return profileData.targetRole !== ""
      default:
        return false
    }
  }

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl p-8 shadow-xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 5</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSkipAll}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip all
              </button>
              <span className="text-sm font-medium text-blue-600">{Math.round((step / 5) * 100)}%</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Career Stage */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MockZen! 👋</h2>
              <p className="text-gray-600">Let's personalize your interview experience. What's your career stage?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {careerStages.map((stage) => {
                const Icon = stage.icon
                return (
                  <button
                    key={stage.id}
                    onClick={() => setProfileData({ ...profileData, careerStage: stage.id })}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      profileData.careerStage === stage.id
                        ? "border-blue-600 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    <Icon
                      className={`w-10 h-10 mb-3 ${profileData.careerStage === stage.id ? "text-blue-600" : "text-gray-400"}`}
                    />
                    <h3 className="font-semibold text-gray-900 mb-1 text-lg">{stage.title}</h3>
                    <p className="text-sm text-gray-600">{stage.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2: Experience Level */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">How much experience do you have? 💼</h2>
              <p className="text-gray-600">This helps us match questions to your skill level.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {experienceLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setProfileData({ ...profileData, yearsOfExperience: level.id })}
                  className={`p-5 rounded-lg border-2 transition-all text-left ${
                    profileData.yearsOfExperience === level.id
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-1">{level.label}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Education Level */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your education level? 🎓</h2>
              <p className="text-gray-600">Select your highest level of education.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {educationLevels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => setProfileData({ ...profileData, educationLevel: level.id })}
                  className={`p-5 rounded-lg border-2 transition-all text-center ${
                    profileData.educationLevel === level.id
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="text-3xl mb-2">{level.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-sm">{level.label}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Skills */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What are your skills? 🚀</h2>
              <p className="text-gray-600">Select all the skills you're comfortable with (choose at least one).</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {commonSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    profileData.skills.includes(skill)
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : "border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {profileData.skills.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  Selected {profileData.skills.length} skill{profileData.skills.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Target Role */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">What role are you targeting? 🎯</h2>
              <p className="text-gray-600">This helps us prepare you for the right type of interviews.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {targetRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setProfileData({ ...profileData, targetRole: role.id })}
                  className={`p-5 rounded-lg border-2 transition-all text-center ${
                    profileData.targetRole === role.id
                      ? "border-blue-600 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="text-3xl mb-2">{role.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-sm">{role.label}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          {step > 1 ? (
            <Button onClick={() => setStep(step - 1)} variant="outline">
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (step < 5) setStep(step + 1)
                else void handleComplete()
              }}
              disabled={loading}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              Skip
            </button>
            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading || !canProceed()}
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
