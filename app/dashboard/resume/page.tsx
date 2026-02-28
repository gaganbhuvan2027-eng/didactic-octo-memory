"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, Download, History, Star, ClipboardPaste, Briefcase, Building2 } from "lucide-react"
import Link from "next/link"
import DashboardNavbar from "@/components/dashboard-navbar"
import { companies, roles } from "@/lib/companies"
import { useToast } from "@/hooks/use-toast"
import { downloadResumeReport } from "@/utils/download-report"

interface ResumeScan {
  id: string
  file_name: string
  overall_score: number
  summary: string
  sections: any[]
  improvements: string[]
  strengths: string[]
  detailed_feedback: string
  ats_score: number
  keyword_analysis: any
  created_at: string
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [inputMode, setInputMode] = useState<"file" | "text">("file")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ResumeScan[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch scan history on mount
  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/resume/history")
      if (res.ok) {
        const data = await res.json()
        setHistory(data.scans || [])
      }
    } catch (err) {
      console.error("Error fetching resume history:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleScan = async () => {
    if (inputMode === "file" && !file) {
      setError("Please select a resume file.")
      return
    }
    
    if (inputMode === "text" && resumeText.trim().length < 50) {
      setError("Please paste your resume content (at least 50 characters).")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      
      if (inputMode === "file" && file) {
        formData.append("resume", file)
      } else {
        // Send the pasted text as a blob file
        const textBlob = new Blob([resumeText], { type: "text/plain" })
        formData.append("resume", textBlob, "pasted-resume.txt")
        formData.append("resumeText", resumeText)
      }

      const response = await fetch("/api/resume/scan", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan resume")
      }

      setResult(data.data)
      toast({
        title: "Scan Complete",
        description: "Your resume has been successfully analyzed.",
      })
      
      // Refresh credits in the navbar and history
      if ((window as any).refreshCredits) {
        (window as any).refreshCredits()
      }
      fetchHistory()

    } catch (err: any) {
      console.error(err)
      setError(err.message)
      toast({
        variant: "destructive",
        title: "Scan Failed",
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const viewHistoryScan = (scan: ResumeScan) => {
    const idealJobs = scan.keyword_analysis?.ideal_jobs || { roles: [], companies: [] }
    setResult({
      score: scan.overall_score,
      ats_score: scan.ats_score,
      summary: scan.summary,
      sections: scan.sections,
      improvements: scan.improvements,
      strengths: scan.strengths,
      detailed_feedback: scan.detailed_feedback,
      keyword_analysis: scan.keyword_analysis,
      ideal_jobs: idealJobs,
    })
    setFile({ name: scan.file_name } as File)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Scanner</h1>
          <p className="text-gray-600 mt-2">Upload your resume to get instant AI feedback and ratings. (Cost: 1 Credit)</p>
        </div>

        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              New Scan
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Scan History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Upload Section */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Resume</CardTitle>
                    <CardDescription>Upload a file or paste your resume text</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Input Mode Toggle */}
                    <div className="flex gap-2">
                      <Button 
                        variant={inputMode === "file" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setInputMode("file")}
                        disabled={loading}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload File
                      </Button>
                      <Button 
                        variant={inputMode === "text" ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => setInputMode("text")}
                        disabled={loading}
                      >
                        <ClipboardPaste className="h-4 w-4 mr-1" />
                        Paste Text
                      </Button>
                    </div>

                    {inputMode === "file" ? (
                      <>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="resume">Resume File</Label>
                          <Input 
                            id="resume" 
                            type="file" 
                            accept=".txt,.pdf,application/pdf" 
                            onChange={handleFileChange}
                            disabled={loading}
                          />
                          <p className="text-xs text-gray-500">
                            Supported: TXT, PDF (text will be extracted)
                          </p>
                        </div>

                        {file && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            <FileText className="h-4 w-4" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="resumeText">Paste Resume Content</Label>
                        <Textarea
                          id="resumeText"
                          placeholder="Paste your resume content here...

Example:
John Doe
Software Engineer
john@email.com | (555) 123-4567

EXPERIENCE
Senior Developer at Tech Corp (2020-Present)
- Led team of 5 developers
- Increased performance by 40%

SKILLS
JavaScript, React, Node.js, Python..."
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          className="min-h-[200px] text-sm"
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500">
                          {resumeText.length} characters {resumeText.length < 50 && "(minimum 50)"}
                        </p>
                      </div>
                    )}

                    <Button 
                      className="w-full" 
                      onClick={handleScan} 
                      disabled={(inputMode === "file" && !file) || (inputMode === "text" && resumeText.trim().length < 50) || loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing Resume...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Scan Resume (1 Credit)
                        </>
                      )}
                    </Button>

                    {inputMode === "text" && (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Recommended</AlertTitle>
                        <AlertDescription className="text-green-700 text-xs">
                          Pasting text directly gives the best results. Copy from your Word doc or PDF viewer.
                        </AlertDescription>
                      </Alert>
                    )}

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div className="lg:col-span-2">
                {result ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Score Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-l-4 border-l-blue-600">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-gray-900">Overall Score</h2>
                              <p className="text-sm text-gray-500">Resume quality rating</p>
                            </div>
                            <div className="flex flex-col items-center justify-center bg-blue-50 rounded-full h-20 w-20 border-4 border-blue-100">
                              <span className="text-2xl font-bold text-blue-700">{result.score || result.overall_score}</span>
                              <span className="text-xs text-blue-600 font-medium">/ 100</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {result.ats_score && (
                        <Card className="border-l-4 border-l-green-600">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h2 className="text-lg font-semibold text-gray-900">ATS Score</h2>
                                <p className="text-sm text-gray-500">Applicant tracking compatibility</p>
                              </div>
                              <div className="flex flex-col items-center justify-center bg-green-50 rounded-full h-20 w-20 border-4 border-green-100">
                                <span className="text-2xl font-bold text-green-700">{result.ats_score}</span>
                                <span className="text-xs text-green-600 font-medium">/ 100</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Summary */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h2 className="text-xl font-bold text-gray-900">Summary</h2>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => downloadResumeReport(result, file?.name || "resume")}
                          >
                            <Download className="h-4 w-4" />
                            Download PDF Report
                          </Button>
                        </div>
                        <p className="text-gray-600">{result.summary}</p>
                      </CardContent>
                    </Card>

                    {/* Ideal Jobs */}
                    {(result.ideal_jobs?.roles?.length > 0 || result.ideal_jobs?.companies?.length > 0) && (
                      <Card className="border-l-4 border-l-indigo-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-indigo-500" />
                            Ideal Jobs for You
                          </CardTitle>
                          <CardDescription>Roles and companies that match your resume</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {result.ideal_jobs.roles?.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                Recommended Roles
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {result.ideal_jobs.roles.map((roleId: string) => {
                                  const role = roles.find((r) => r.id === roleId)
                                  return (
                                    <Link key={roleId} href={`/interviews/role/${roleId}`}>
                                      <Badge variant="secondary" className="cursor-pointer hover:bg-indigo-100">
                                        {role?.name || roleId}
                                      </Badge>
                                    </Link>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                          {result.ideal_jobs.companies?.length > 0 && (
                            <div>
                              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                Recommended Companies
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {result.ideal_jobs.companies.map((companyId: string) => {
                                  const company = companies.find((c) => c.id === companyId)
                                  return (
                                    <Link key={companyId} href={`/interviews/company/${companyId}`}>
                                      <Badge variant="outline" className="cursor-pointer hover:bg-indigo-50">
                                        {company?.name || companyId}
                                      </Badge>
                                    </Link>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Strengths */}
                    {result.strengths && result.strengths.length > 0 && (
                      <Card className="border-l-4 border-l-green-500">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-green-500" />
                            Key Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {result.strengths.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* Section Breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Detailed Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {(result.sections || []).map((section: any, index: number) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold text-gray-900">{section.name}</h3>
                              <Badge variant={section.score >= 80 ? "default" : section.score >= 60 ? "secondary" : "destructive"}>
                                {section.score}/100
                              </Badge>
                            </div>
                            <Progress value={section.score} className="h-2 mb-2" />
                            <p className="text-sm text-gray-600">{section.feedback}</p>
                            {index < result.sections.length - 1 && <Separator className="my-4" />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Improvements */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Priority Improvements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3">
                          {(result.improvements || []).map((item: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 font-bold">→</span>
                              <span className="text-gray-700">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Detailed Feedback */}
                    {result.detailed_feedback && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Detailed Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{result.detailed_feedback}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 border-2 border-dashed rounded-lg bg-gray-50/50 min-h-[400px]">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No scan results yet</p>
                    <p className="text-sm">Upload a resume to see detailed feedback here</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Scan History</CardTitle>
                <CardDescription>View your previous resume scans</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No previous scans found</p>
                    <p className="text-sm">Upload a resume to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((scan) => (
                      <div 
                        key={scan.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => viewHistoryScan(scan)}
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="h-10 w-10 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">{scan.file_name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(scan.created_at).toLocaleDateString()} at {new Date(scan.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge variant={scan.overall_score >= 80 ? "default" : scan.overall_score >= 60 ? "secondary" : "destructive"}>
                              Score: {scan.overall_score}/100
                            </Badge>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadResumeReport({
                                score: scan.overall_score,
                                ats_score: scan.ats_score,
                                summary: scan.summary,
                                sections: scan.sections,
                                improvements: scan.improvements,
                                strengths: scan.strengths,
                                detailed_feedback: scan.detailed_feedback,
                                keyword_analysis: scan.keyword_analysis,
                              }, scan.file_name)
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

