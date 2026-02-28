"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"

interface ScenarioBuilderProps {
  onComplete: (scenario: CustomScenario) => void
  onBack: () => void
}

export interface CustomScenario {
  description: string
  goals: string[]
  focusAreas: string[]
  context: string
}

const PRESET_TEMPLATES = [
  {
    name: "Startup Pitch",
    description: "Practice pitching your startup idea to investors",
    goals: ["Explain business model clearly", "Address investor concerns", "Demonstrate market opportunity"],
    focusAreas: ["Communication", "Business Acumen", "Confidence"],
    context: "You're pitching to venture capitalists who are considering investing in your startup.",
  },
  {
    name: "Technical Leadership",
    description: "Senior technical leadership role with system design focus",
    goals: ["Demonstrate architectural thinking", "Explain technical trade-offs", "Show leadership experience"],
    focusAreas: ["System Design", "Team Management", "Strategic Planning"],
    context: "You're interviewing for a senior engineering manager position at a fast-growing tech company.",
  },
  {
    name: "Product Management",
    description: "Product strategy and stakeholder management interview",
    goals: ["Demonstrate product thinking", "Prioritization skills", "User empathy"],
    focusAreas: ["Product Strategy", "Stakeholder Management", "Data-Driven Decisions"],
    context: "You're interviewing for a product manager role where you'll own a key product area.",
  },
  {
    name: "Customer Success",
    description: "Handle difficult customer situations and drive satisfaction",
    goals: ["Resolve conflicts effectively", "Build customer relationships", "Identify upsell opportunities"],
    focusAreas: ["Communication", "Problem Solving", "Empathy"],
    context: "You're interviewing for a customer success manager role at a SaaS company.",
  },
]

export default function CustomScenarioBuilder({ onComplete, onBack }: ScenarioBuilderProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [context, setContext] = useState("")
  const [goals, setGoals] = useState<string[]>([])
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [currentGoal, setCurrentGoal] = useState("")
  const [currentFocus, setCurrentFocus] = useState("")

  const handleTemplateSelect = (index: number) => {
    const template = PRESET_TEMPLATES[index]
    setSelectedTemplate(index)
    setDescription(template.description)
    setContext(template.context)
    setGoals([...template.goals])
    setFocusAreas([...template.focusAreas])
  }

  const addGoal = () => {
    if (currentGoal.trim() && goals.length < 5) {
      setGoals([...goals, currentGoal.trim()])
      setCurrentGoal("")
    }
  }

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index))
  }

  const addFocusArea = () => {
    if (currentFocus.trim() && focusAreas.length < 5) {
      setFocusAreas([...focusAreas, currentFocus.trim()])
      setCurrentFocus("")
    }
  }

  const removeFocusArea = (index: number) => {
    setFocusAreas(focusAreas.filter((_, i) => i !== index))
  }

  const handleStartInterview = () => {
    if (description.trim()) {
      // Use description-derived defaults when goals/focus are empty
      const effectiveGoals = goals.length > 0 ? goals : ["Demonstrate skills relevant to the scenario"]
      const effectiveFocus = focusAreas.length > 0 ? focusAreas : ["Skills and experience from the scenario"]
      onComplete({
        description: description.trim(),
        goals: effectiveGoals,
        focusAreas: effectiveFocus,
        context: context.trim() || "Standard interview setting",
      })
    }
  }

  const isValid = description.trim() !== ""

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Build Your Custom Scenario</h2>
        <p className="text-sm md:text-base text-gray-600">
          Choose a template or create your own interview scenario from scratch
        </p>
      </div>

      {/* Template Selection */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Quick Start Templates</CardTitle>
          <CardDescription className="text-sm">Select a pre-built scenario or start from scratch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {PRESET_TEMPLATES.map((template, index) => (
              <button
                key={index}
                onClick={() => handleTemplateSelect(index)}
                className={`text-left p-3 md:p-4 rounded-lg border-2 transition-all ${
                  selectedTemplate === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                }`}
              >
                <h3 className="font-semibold text-sm md:text-base text-gray-900 mb-1">{template.name}</h3>
                <p className="text-xs md:text-sm text-gray-600">{template.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scenario Details */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Scenario Details</CardTitle>
          <CardDescription className="text-sm">Describe what you want to practice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div>
            <Label htmlFor="description" className="text-sm md:text-base font-semibold mb-2 block">
              Scenario Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Example: Practice interviewing for a senior software engineer role at a FAANG company..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] md:min-h-[100px] text-sm md:text-base"
            />
          </div>

          <div>
            <Label htmlFor="context" className="text-sm md:text-base font-semibold mb-2 block">
              Interview Context (Optional)
            </Label>
            <Textarea
              id="context"
              placeholder="Provide additional context like company type, interview panel, specific challenges..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[60px] md:min-h-[80px] text-sm md:text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Interview Goals (Optional)</CardTitle>
          <CardDescription className="text-sm">What do you want to demonstrate? Add 1-5 goals for more tailored questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Example: Explain system architecture clearly"
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGoal())}
                className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={goals.length >= 5}
              />
              <Button
                onClick={addGoal}
                disabled={!currentGoal.trim() || goals.length >= 5}
                className="text-sm md:text-base"
              >
                Add Goal
              </Button>
            </div>

            {goals.length > 0 && (
              <div className="space-y-2">
                {goals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <span className="flex-1 text-xs md:text-sm text-gray-900">{goal}</span>
                    <button
                      onClick={() => removeGoal(index)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card className="mb-4 md:mb-6">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Focus Areas (Optional)</CardTitle>
          <CardDescription className="text-sm">What skills should the interviewer assess? Add 1-5 areas for better targeting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Example: System Design, Leadership, Communication"
                value={currentFocus}
                onChange={(e) => setCurrentFocus(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFocusArea())}
                className="flex-1 px-3 py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={focusAreas.length >= 5}
              />
              <Button
                onClick={addFocusArea}
                disabled={!currentFocus.trim() || focusAreas.length >= 5}
                className="text-sm md:text-base"
              >
                Add Focus
              </Button>
            </div>

            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-green-50 rounded-full border border-green-200"
                  >
                    <span className="text-xs md:text-sm font-medium text-gray-900">{area}</span>
                    <button
                      onClick={() => removeFocusArea(index)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-end">
        <Button variant="outline" onClick={onBack} className="w-full md:w-auto bg-transparent">
          Back
        </Button>
        <Button
          onClick={handleStartInterview}
          disabled={!isValid}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 px-6 md:px-8"
        >
          Start Custom Interview
        </Button>
      </div>
    </div>
  )
}
