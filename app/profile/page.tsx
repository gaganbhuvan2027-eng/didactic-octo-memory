"use client"

import type React from "react"

import { useState, useEffect } from "react"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Save, Loader2, Building2, Upload, FileText, CheckCircle2, ClipboardPaste } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [newSkill, setNewSkill] = useState("")
  const [newEducation, setNewEducation] = useState({ degree: "", school: "", year: "" })
  const [newExperience, setNewExperience] = useState({ title: "", company: "", duration: "" })

  const [inviteCode, setInviteCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinMessage, setJoinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [joinCode, setJoinCode] = useState("")
  const [isJoiningBatch, setIsJoiningBatch] = useState(false)
  const [batchJoinMessage, setBatchJoinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [currentInstitution, setCurrentInstitution] = useState<any>(null)
  const [currentBatches, setCurrentBatches] = useState<any[]>([])

  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isParsingResume, setIsParsingResume] = useState(false)
  const [resumeMessage, setResumeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [resumeInputMode, setResumeInputMode] = useState<"file" | "text">("text")
  const [resumeTextInput, setResumeTextInput] = useState("")

  useEffect(() => {
    fetchProfile()
    fetchUserInstitution()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserInstitution = async () => {
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        
        if (data.institution_id) {
          const supabase = createClient()
          const { data: institutionData } = await supabase
            .from("institutions")
            .select("id, name")
            .eq("id", data.institution_id)
            .single()

          if (institutionData) {
            setCurrentInstitution(institutionData)

            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
              const { data: batchMembers } = await supabase
                .from("batch_members")
                .select("batches(id, name, description)")
                .eq("user_id", user.id)

              if (batchMembers) {
                setCurrentBatches(batchMembers.map((bm: any) => bm.batches))
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching institution:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setIsEditing(false)
        await fetchProfile()
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), newSkill.trim()],
      })
      setNewSkill("")
    }
  }

  const removeSkill = (index: number) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((_: any, i: number) => i !== index),
    })
  }

  const addEducation = () => {
    if (newEducation.degree && newEducation.school) {
      setProfile({
        ...profile,
        education: [...(profile.education || []), newEducation],
      })
      setNewEducation({ degree: "", school: "", year: "" })
    }
  }

  const removeEducation = (index: number) => {
    setProfile({
      ...profile,
      education: profile.education.filter((_: any, i: number) => i !== index),
    })
  }

  const addExperience = () => {
    if (newExperience.title && newExperience.company) {
      setProfile({
        ...profile,
        experience: [...(profile.experience || []), newExperience],
      })
      setNewExperience({ title: "", company: "", duration: "" })
    }
  }

  const removeExperience = (index: number) => {
    setProfile({
      ...profile,
      experience: profile.experience.filter((_: any, i: number) => i !== index),
    })
  }

  const handleJoinInstitution = async () => {
    if (!inviteCode.trim()) {
      setJoinMessage({ type: "error", text: "Please enter an invite code" })
      return
    }

    setIsJoining(true)
    setJoinMessage(null)

    try {
      const response = await fetch("/api/institution/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setJoinMessage({ type: "success", text: `Successfully joined ${data.institutionName}!` })
        setInviteCode("")
        await fetchProfile()
        await fetchUserInstitution()
      } else {
        setJoinMessage({ type: "error", text: data.error || "Failed to join institution" })
      }
    } catch (error) {
      console.error("Error joining institution:", error)
      setJoinMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsJoining(false)
    }
  }

  const handleJoinBatch = async () => {
    if (!joinCode.trim()) {
      setBatchJoinMessage({ type: "error", text: "Please enter a join code" })
      return
    }

    setIsJoiningBatch(true)
    setBatchJoinMessage(null)

    try {
      const response = await fetch("/api/batches/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setBatchJoinMessage({
          type: "success",
          text: `Successfully joined ${data.batchName} in ${data.institutionName}!`,
        })
        setJoinCode("")
        await fetchUserInstitution()
      } else {
        setBatchJoinMessage({ type: "error", text: data.error || "Failed to join batch" })
      }
    } catch (error) {
      setBatchJoinMessage({ type: "error", text: "An error occurred. Please try again." })
    } finally {
      setIsJoiningBatch(false)
    }
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Only allow .txt files
    if (!file.name.endsWith('.txt') && file.type !== 'text/plain') {
      setResumeMessage({
        type: "error",
        text: "Please upload a .txt file only. PDF and DOCX are not supported.",
      })
      event.target.value = ""
      return
    }

    setIsUploadingResume(true)
    setResumeMessage(null)

    try {
      // Read the text content directly
      const textContent = await file.text()

      if (textContent.trim().length < 50) {
        throw new Error("Resume content is too short. Please provide more details.")
      }

      setIsParsingResume(true)
      const parseResponse = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: textContent }),
      })

      if (!parseResponse.ok) {
        const error = await parseResponse.json()
        throw new Error(error.error || "Parsing failed")
      }

      const parseData = await parseResponse.json()
      console.log("[v0] Resume parsed:", parseData.data)

      setResumeMessage({
        type: "success",
        text: "Resume parsed successfully! Your profile has been updated.",
      })

      await fetchProfile()
    } catch (error: any) {
      console.error("[v0] Resume upload error:", error)
      setResumeMessage({
        type: "error",
        text: error.message || "Failed to parse resume. Please try again.",
      })
    } finally {
      setIsUploadingResume(false)
      setIsParsingResume(false)
      event.target.value = ""
    }
  }

  const handleResumeTextSubmit = async () => {
    if (resumeTextInput.trim().length < 50) {
      setResumeMessage({
        type: "error",
        text: "Resume content is too short. Please paste at least 50 characters.",
      })
      return
    }

    setIsParsingResume(true)
    setResumeMessage(null)

    try {
      const parseResponse = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: resumeTextInput }),
      })

      if (!parseResponse.ok) {
        const error = await parseResponse.json()
        throw new Error(error.error || "Parsing failed")
      }

      const parseData = await parseResponse.json()
      console.log("[v0] Resume parsed:", parseData.data)

      setResumeMessage({
        type: "success",
        text: "Resume parsed successfully! Your profile has been updated with your skills and experience.",
      })
      setResumeTextInput("")
      await fetchProfile()
    } catch (error: any) {
      console.error("[v0] Resume text parse error:", error)
      setResumeMessage({
        type: "error",
        text: error.message || "Failed to parse resume. Please try again.",
      })
    } finally {
      setIsParsingResume(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <DashboardNavbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </main>
    )
  }

  if (!profile) return null

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Your Profile</h1>
            <p className="text-lg text-gray-600">Manage your account and personal information.</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-400 text-white"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <Card className="p-8 mb-8 border-0 shadow-sm bg-gradient-to-br from-white to-blue-50">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`}
              />
              <AvatarFallback>{profile.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{profile.name || "User"}</h2>
              <p className="text-gray-600 mb-1">{profile.email}</p>
              {profile.location && <p className="text-sm text-gray-500">{profile.location}</p>}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total Interviews</p>
              <p className="text-2xl font-bold text-blue-600">{profile.stats?.totalInterviews || 0}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">{profile.stats?.averageScore || 0}%</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Skills</p>
              <p className="text-2xl font-bold text-blue-600">{profile.skills?.length || 0}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Experience</p>
              <p className="text-2xl font-bold text-blue-600">{profile.experience?.length || 0}</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="institution">Institution</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about">
            <Card className="p-8 border-0 shadow-sm mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">About Me</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <Textarea
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    className="min-h-[120px] disabled:opacity-75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <Input
                    value={profile.location || ""}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    disabled={!isEditing}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <Input
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-8 border-0 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Resume for Personalization</h3>

              {profile.resume_data ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-1">Resume Data Saved</h4>
                      <p className="text-sm text-green-700 mb-2">
                        Your resume has been analyzed. Interview questions will be personalized based on
                        your experience.
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">Want to update your resume data? Paste new content below:</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Add your resume to automatically populate your profile and get personalized interview questions
                    based on your experience.
                  </p>
                </div>
              )}

              {/* Input Mode Toggle */}
              <div className="flex gap-2 mt-4 mb-4">
                <Button 
                  variant={resumeInputMode === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResumeInputMode("text")}
                  disabled={isParsingResume}
                >
                  <ClipboardPaste className="h-4 w-4 mr-1" />
                  Paste Text
                </Button>
                <Button 
                  variant={resumeInputMode === "file" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setResumeInputMode("file")}
                  disabled={isParsingResume}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload TXT
                </Button>
              </div>

              {resumeInputMode === "text" ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Recommended:</strong> Paste your resume text directly for best results. Copy from your Word doc or PDF viewer.
                    </p>
                  </div>
                  
                  <Textarea
                    placeholder="Paste your resume content here...

Example:
John Doe
Software Engineer | john@email.com | (555) 123-4567

SUMMARY
5+ years of experience in full-stack development...

EXPERIENCE
Senior Developer at Tech Corp (2020-Present)
- Led team of 5 developers
- Increased performance by 40%

SKILLS
JavaScript, React, Node.js, Python, SQL..."
                    value={resumeTextInput}
                    onChange={(e) => setResumeTextInput(e.target.value)}
                    className="min-h-[200px] text-sm"
                    disabled={isParsingResume}
                  />
                  <p className="text-xs text-gray-500">
                    {resumeTextInput.length} characters {resumeTextInput.length < 50 && "(minimum 50)"}
                  </p>
                  <Button 
                    onClick={handleResumeTextSubmit}
                    disabled={resumeTextInput.trim().length < 50 || isParsingResume}
                    className="w-full"
                  >
                    {isParsingResume ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Resume Data
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <label
                      htmlFor="resume-upload"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload TXT File
                    </label>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".txt"
                      onChange={handleResumeUpload}
                      disabled={isUploadingResume || isParsingResume}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">TXT files only</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                    <h4 className="font-semibold text-blue-900 mb-2">What we extract from your resume:</h4>
                    <ul className="space-y-1 text-sm text-blue-800">
                      <li>• Technical skills and expertise</li>
                      <li>• Work experience and roles</li>
                      <li>• Education and certifications</li>
                      <li>• Projects and achievements</li>
                    </ul>
                  </div>

              {(isUploadingResume || isParsingResume) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-semibold text-blue-900">
                      {isUploadingResume && !isParsingResume && "Uploading resume..."}
                      {isParsingResume && "Analyzing resume with AI..."}
                    </p>
                    <p className="text-sm text-blue-700">This may take a few moments</p>
                  </div>
                </div>
              )}

              {resumeMessage && (
                <div
                  className={`mt-4 p-4 rounded-lg ${
                    resumeMessage.type === "success"
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  {resumeMessage.text}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <Card className="p-8 border-0 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.skills?.map((skill: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {skill}
                    {isEditing && (
                      <button onClick={() => removeSkill(index)} className="ml-2 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  />
                  <Button onClick={addSkill} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education">
            <Card className="p-8 border-0 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Education</h3>
              <div className="space-y-4 mb-6">
                {profile.education?.map((edu: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                    {isEditing && (
                      <button
                        onClick={() => removeEducation(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-gray-600">{edu.school}</p>
                    <p className="text-sm text-gray-500">{edu.year}</p>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <Input
                    value={newEducation.degree}
                    onChange={(e) => setNewEducation({ ...newEducation, degree: e.target.value })}
                    placeholder="Degree"
                  />
                  <Input
                    value={newEducation.school}
                    onChange={(e) => setNewEducation({ ...newEducation, school: e.target.value })}
                    placeholder="School/University"
                  />
                  <Input
                    value={newEducation.year}
                    onChange={(e) => setNewEducation({ ...newEducation, year: e.target.value })}
                    placeholder="Year (e.g., 2020-2024)"
                  />
                  <Button onClick={addEducation} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience">
            <Card className="p-8 border-0 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Work Experience</h3>
              <div className="space-y-4 mb-6">
                {profile.experience?.map((exp: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg relative">
                    {isEditing && (
                      <button
                        onClick={() => removeExperience(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                    <p className="text-gray-600">{exp.company}</p>
                    <p className="text-sm text-gray-500">{exp.duration}</p>
                  </div>
                ))}
              </div>
              {isEditing && (
                <div className="space-y-2">
                  <Input
                    value={newExperience.title}
                    onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                    placeholder="Job Title"
                  />
                  <Input
                    value={newExperience.company}
                    onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                    placeholder="Company"
                  />
                  <Input
                    value={newExperience.duration}
                    onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                    placeholder="Duration (e.g., 2020-2023)"
                  />
                  <Button onClick={addExperience} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Institution Tab */}
          <TabsContent value="institution">
            <Card className="p-8 border-0 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Institution & Batches</h3>

              {currentInstitution && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">Current Institution</p>
                  <p className="text-lg font-semibold text-blue-700">{currentInstitution.name}</p>
                </div>
              )}

              {currentBatches.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Batches</p>
                  <div className="space-y-2">
                    {currentBatches.map((batch) => (
                      <div key={batch.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="font-semibold text-purple-900">{batch.name}</p>
                        {batch.description && <p className="text-sm text-purple-700">{batch.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Join Institution</h4>
                {!currentInstitution ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Enter an invite code provided by your institution to join and access exclusive features.
                    </p>

                    <div className="flex gap-4">
                      <Input
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        placeholder="Enter 8-character invite code"
                        maxLength={8}
                        className="flex-1 text-lg tracking-wider uppercase font-mono"
                        disabled={isJoining}
                      />
                      <Button
                        onClick={handleJoinInstitution}
                        disabled={isJoining || !inviteCode.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isJoining ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          "Join Institution"
                        )}
                      </Button>
                    </div>

                    {joinMessage && (
                      <div
                        className={`flex items-start gap-3 p-4 rounded-lg ${
                          joinMessage.type === "success"
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <p
                          className={`text-sm ${joinMessage.type === "success" ? "text-green-800" : "text-red-800"}`}
                        >
                          {joinMessage.text}
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Benefits of Joining an Institution</h4>
                      <ul className="space-y-1 text-sm text-blue-800">
                        <li>• Access to institution-specific interview programs</li>
                        <li>• Track your progress on the institution leaderboard</li>
                        <li>• Participate in scheduled assessments</li>
                        <li>• Get recognized for your achievements</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800">You are already a member of {currentInstitution.name}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Join Batch</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-3">
                      Enter a batch join code to join an institution and batch automatically
                    </p>
                    <div className="flex gap-3">
                      <Input
                        placeholder="Enter 8-character code (e.g. ABC123XY)"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="flex-1 font-mono tracking-wider"
                      />
                      <Button
                        onClick={handleJoinBatch}
                        disabled={isJoiningBatch}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isJoiningBatch ? "Joining..." : "Join Batch"}
                      </Button>
                    </div>
                  </div>

                  {batchJoinMessage && (
                    <div
                      className={`flex items-start gap-3 p-4 rounded-lg ${
                        batchJoinMessage.type === "success"
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          batchJoinMessage.type === "success" ? "text-green-800" : "text-red-800"
                        }`}
                      >
                        {batchJoinMessage.text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="p-8 border-0 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <Input
                        value={profile.name || ""}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <Input value={profile.email || ""} disabled className="bg-gray-100" />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Social Links</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                      <Input
                        value={profile.social_links?.linkedin || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            social_links: { ...profile.social_links, linkedin: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">GitHub</label>
                      <Input
                        value={profile.social_links?.github || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            social_links: { ...profile.social_links, github: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        placeholder="https://github.com/username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
                      <Input
                        value={profile.social_links?.twitter || ""}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            social_links: { ...profile.social_links, twitter: e.target.value },
                          })
                        }
                        disabled={!isEditing}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
