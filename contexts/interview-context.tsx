"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface InterviewState {
  isStarted: boolean
  creditsUsed: number
  questionsAnswered: number
  totalQuestions: number
  interviewId: string | null
}

interface InterviewContextType {
  state: InterviewState
  setInterviewStarted: (started: boolean) => void
  setCreditsUsed: (credits: number) => void
  setQuestionsAnswered: (count: number) => void
  setTotalQuestions: (count: number) => void
  setInterviewId: (id: string | null) => void
  resetState: () => void
}

const defaultState: InterviewState = {
  isStarted: false,
  creditsUsed: 0,
  questionsAnswered: 0,
  totalQuestions: 0,
  interviewId: null,
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined)

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InterviewState>(defaultState)

  const setInterviewStarted = (started: boolean) => {
    setState((prev) => ({ ...prev, isStarted: started }))
  }

  const setCreditsUsed = (credits: number) => {
    setState((prev) => ({ ...prev, creditsUsed: credits }))
  }

  const setQuestionsAnswered = (count: number) => {
    setState((prev) => ({ ...prev, questionsAnswered: count }))
  }

  const setTotalQuestions = (count: number) => {
    setState((prev) => ({ ...prev, totalQuestions: count }))
  }

  const setInterviewId = (id: string | null) => {
    setState((prev) => ({ ...prev, interviewId: id }))
  }

  const resetState = () => {
    setState(defaultState)
  }

  return (
    <InterviewContext.Provider
      value={{
        state,
        setInterviewStarted,
        setCreditsUsed,
        setQuestionsAnswered,
        setTotalQuestions,
        setInterviewId,
        resetState,
      }}
    >
      {children}
    </InterviewContext.Provider>
  )
}

export function useInterviewContext() {
  const context = useContext(InterviewContext)
  if (context === undefined) {
    throw new Error("useInterviewContext must be used within an InterviewProvider")
  }
  return context
}

