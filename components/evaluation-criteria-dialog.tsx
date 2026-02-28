"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CriteriaSection {
  title: string
  subtitle?: string
  items: string[]
}

const behavioralCriteria: CriteriaSection[] = [
  {
    title: "Domain knowledge",
    subtitle: "What you know",
    items: [
      "Response accuracy – relevance to the question",
      "Use of correct terminology",
    ],
  },
  {
    title: "Articulation & problem solving",
    subtitle: "How you answer",
    items: [
      "Logical structure and flow",
      "Concrete examples to support your points",
    ],
  },
  {
    title: "Teamwork & leadership",
    subtitle: "How you position yourself",
    items: [
      "Team collaboration and contribution",
      "Leadership and ownership examples",
    ],
  },
  {
    title: "Communication",
    subtitle: "How you present",
    items: [
      "Voice clarity and pacing",
      "Filler words and grammar",
      "Overall clarity of expression",
    ],
  },
]

const dsaCriteria: CriteriaSection[] = [
  {
    title: "Correctness",
    subtitle: "Solution quality",
    items: [
      "Algorithm produces correct output",
      "Handles edge cases appropriately",
    ],
  },
  {
    title: "Approach & logic",
    subtitle: "Problem solving",
    items: [
      "Correct data structure and algorithm choice",
      "Clear reasoning and step-by-step logic",
    ],
  },
  {
    title: "Complexity",
    subtitle: "Efficiency",
    items: [
      "Time complexity awareness",
      "Space complexity consideration",
    ],
  },
  {
    title: "Code quality",
    subtitle: "Implementation",
    items: [
      "Readable and maintainable code",
      "Proper variable naming and structure",
    ],
  },
]

const aptitudeCriteria: CriteriaSection[] = [
  {
    title: "Accuracy",
    subtitle: "Correct answer",
    items: [
      "Numerical correctness",
      "Sound reasoning and steps",
    ],
  },
  {
    title: "Approach",
    subtitle: "Problem solving",
    items: [
      "Correct method applied",
      "Efficient calculation strategy",
    ],
  },
  {
    title: "Reasoning",
    subtitle: "Logical thinking",
    items: [
      "Clear logical flow",
      "Identification of key information",
    ],
  },
]

const codingRulesCriteria: CriteriaSection[] = [
  {
    title: "Code execution (all 4 languages)",
    subtitle: "How your code runs in our sandbox",
    items: [
      "Java: Use class name Main, no package statements, no other public classes",
      "Python: Run as main.py, standard library only, no pip",
      "C++: Must contain int main(), standard library only",
      "JavaScript (Node): Run as main.js, no browser APIs, standard input/output only",
    ],
  },
  {
    title: "Input & output",
    subtitle: "Required for auto-grading and hidden test cases",
    items: [
      "Read from standard input (stdin) – do not hardcode test data",
      "Print to standard output (stdout)",
      "Use standard input/output only – no external libraries",
      "Do not hardcode answers – enables hidden test cases like real interview platforms",
    ],
  },
  {
    title: "Output comparison",
    subtitle: "How your solution is graded",
    items: [
      "Trim whitespace before comparison",
      "Ignore extra newline at end of output",
      "Verdicts: Accepted, Wrong Answer, Compilation Error, Runtime Error",
    ],
  },
]

const codingCriteria: CriteriaSection[] = [
  {
    title: "Correctness",
    subtitle: "Solution quality",
    items: [
      "Code produces correct output for given inputs",
      "Handles edge cases appropriately",
    ],
  },
  {
    title: "Approach & logic",
    subtitle: "Problem solving",
    items: [
      "Correct data structure and algorithm choice",
      "Clear reasoning and step-by-step logic",
    ],
  },
  {
    title: "Code quality",
    subtitle: "Implementation",
    items: [
      "Readable and maintainable code",
      "Proper variable naming and structure",
    ],
  },
]

// Coding round is only for role-wise interviews (not company or course)
function isCodingRound(interviewType?: string | null): boolean {
  return !!(interviewType && interviewType.startsWith("role-"))
}

function getCriteriaForType(interviewType?: string | null): CriteriaSection[] {
  if (!interviewType) return behavioralCriteria
  if (interviewType.startsWith("dsa-") || interviewType === "dsa") {
    return [...dsaCriteria, ...codingRulesCriteria]
  }
  if (interviewType.startsWith("aptitude") || interviewType === "aptitude") return aptitudeCriteria
  if (isCodingRound(interviewType)) {
    return [...codingCriteria, ...codingRulesCriteria]
  }
  return behavioralCriteria
}

interface EvaluationCriteriaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  interviewType?: string | null
}

export function EvaluationCriteriaDialog({
  open,
  onOpenChange,
  interviewType,
}: EvaluationCriteriaDialogProps) {
  const sections = getCriteriaForType(interviewType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluation criteria</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 -mt-2">
          Your performance is assessed on the following:
        </p>
        <div className="space-y-6 mt-4">
          {sections.map((section, i) => (
            <div key={i} className="space-y-2">
              <h4 className="font-semibold text-gray-900">{section.title}</h4>
              {section.subtitle && (
                <p className="text-xs text-gray-500">{section.subtitle}</p>
              )}
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {section.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
