"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from "lucide-react"

interface ExitInterviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  creditsUsed?: number
  isInterviewStarted?: boolean
}

export function ExitInterviewDialog({
  isOpen,
  onClose,
  onConfirm,
  creditsUsed = 0,
  isInterviewStarted = false,
}: ExitInterviewDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              {isInterviewStarted ? "End Interview Early?" : "Leave Interview?"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-left">
              <p className="text-gray-600">
                {isInterviewStarted
                  ? "You're about to end your interview before completing all questions."
                  : "You're about to leave the interview page."}
              </p>

              {isInterviewStarted && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-amber-800">⚠️ Important:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>
                      • <strong>{creditsUsed} credits</strong> have already been deducted for this interview
                    </li>
                    <li>
                      • Credits will <strong>NOT be refunded</strong> if you leave early
                    </li>
                    <li>
                      • Your progress will be saved and analyzed
                    </li>
                  </ul>
                </div>
              )}

              {!isInterviewStarted && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-700">
                    You haven't started the interview yet. No credits have been used.
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500">
                {isInterviewStarted
                  ? "Are you sure you want to end the interview now?"
                  : "Are you sure you want to leave?"}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="mt-0">
            Continue Interview
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isInterviewStarted 
              ? "bg-amber-600 hover:bg-amber-700 text-white" 
              : "bg-gray-600 hover:bg-gray-700 text-white"
            }
          >
            {isInterviewStarted ? "End & Analyze" : "Leave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

