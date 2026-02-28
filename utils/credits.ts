/**
 * Get credit cost for an interview.
 * @param duration - Duration in minutes
 * @param interviewType - Optional. DSA/aptitude use different pricing than regular interviews.
 */
export function getInterviewCost(duration: number, interviewType?: string): number {
  const isTest = interviewType?.startsWith("dsa-") || interviewType?.startsWith("aptitude")

  if (isTest) {
    // DSA/Aptitude: 15 min → 1, 30 min → 2, 45 min → 3
    if (duration <= 15) return 1
    if (duration <= 30) return 2
    if (duration <= 45) return 3
    return Math.ceil(duration / 15)
  }

  // Regular interviews: 5 min → 1, 15 min → 3, 30 min → 6
  if (duration <= 5) return 1
  if (duration <= 15) return 3
  if (duration <= 30) return 6
  return Math.ceil(duration / 5)
}

