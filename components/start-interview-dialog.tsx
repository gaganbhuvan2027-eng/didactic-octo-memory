"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface StartInterviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  creditCost: number
  currentBalance: number
  duration: number
  difficulty: string
  interviewType: string
}

export function StartInterviewDialog({
  isOpen,
  onClose,
  onConfirm,
  creditCost,
  currentBalance,
  duration,
  difficulty,
  interviewType,
}: StartInterviewDialogProps) {
  const hasEnoughCredits = currentBalance >= creditCost

  const isTest = interviewType.startsWith("dsa-") || interviewType.startsWith("aptitude")

  const getInterviewTypeLabel = (type: string) => {
    if (type.startsWith("dsa-")) return "DSA Test"
    if (type.startsWith("aptitude")) return "Aptitude Test"
    if (type.startsWith("frontend")) return "Frontend"
    if (type.startsWith("backend")) return "Backend"
    if (type.startsWith("role-")) return "Role Interview"
    if (type.startsWith("company-")) return "Company Interview"
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">{isTest ? "Start Test?" : "Start Interview?"}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-gray-600">
                You are about to start a {duration}-minute {getInterviewTypeLabel(interviewType)}
                {isTest ? "" : " interview"} at {difficulty} difficulty.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Credit Cost:</span>
                  <span className="font-semibold text-gray-900">{creditCost} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className={`font-semibold ${hasEnoughCredits ? "text-green-600" : "text-red-600"}`}>
                    {currentBalance} credits
                  </span>
                </div>
                {!hasEnoughCredits && (
                  <p className="text-red-600 text-sm mt-2">
                    You don&apos;t have enough credits for this interview.
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Credits will be deducted when the {isTest ? "test" : "interview"} starts.
                {!isTest && " Make sure you have a stable internet connection and your microphone/camera ready."}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={!hasEnoughCredits}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isTest ? "Start Test" : "Start Interview"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
