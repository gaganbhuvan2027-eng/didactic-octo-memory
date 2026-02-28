"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Flag } from "lucide-react"

const REPORT_OPTIONS = [
  { id: "unrelated_question", label: "Unrelated question" },
  { id: "no_audio", label: "No audio" },
  { id: "no_video", label: "No video" },
  { id: "ai_not_responding", label: "AI not responding" },
  { id: "wrong_question", label: "Wrong or repeated question" },
  { id: "technical_issue", label: "Technical issue" },
] as const

interface ReportInterviewDialogProps {
  isOpen: boolean
  onClose: () => void
  interviewId?: string | null
}

export function ReportInterviewDialog({
  isOpen,
  onClose,
  interviewId,
}: ReportInterviewDialogProps) {
  const { toast } = useToast()
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleToggle = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (selectedTypes.length === 0 && !comment.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/interview/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          types: selectedTypes,
          comment: comment.trim(),
          interviewId: interviewId || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to submit report")
      }
      setSelectedTypes([])
      setComment("")
      toast({ title: "Thank you", description: "Your report has been submitted. We'll look into it." })
      onClose()
    } catch (err) {
      console.error("Report submit error:", err)
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to submit report", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedTypes([])
    setComment("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg">Report an issue</DialogTitle>
          </div>
          <DialogDescription>
            Select the issues you&apos;re experiencing. Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-3">
            {REPORT_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-md p-2 -m-2 transition-colors"
              >
                <Checkbox
                  checked={selectedTypes.includes(opt.id)}
                  onCheckedChange={() => handleToggle(opt.id)}
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other (optional)
            </label>
            <Textarea
              placeholder="Describe any other issue..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(selectedTypes.length === 0 && !comment.trim()) || submitting}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
