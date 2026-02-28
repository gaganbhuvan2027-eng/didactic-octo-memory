export interface SpeechAnalysis {
  originalText: string
  hasActiveFiller: boolean
  isComplete: boolean
  confidence: number
  wordCount: number
  lastWords: string
}

// Continuation signals - indicate user is still formulating thoughts
const CONTINUATION_SIGNALS = new Set([
  "um",
  "uh",
  "umm",
  "uhh",
  "er",
  "ah",
  "ahh",
  "hmm",
  "hmmm",
  "because",
  "and",
  "but",
  "so",
  "or",
  "also",
  "however",
  "therefore",
  "moreover",
  "furthermore",
  "additionally",
])

const SENTENCE_ENDERS = new Set([".", "!", "?"])

// True completion indicators - statements that suggest finality
const COMPLETION_INDICATORS = [
  /\.(?: |$)/,
  /(that's all|that's it|thank you|done|finished|that's my answer)$/i,
  /(i think that|i believe that|in conclusion|to summarize).*\./i,
]

export class SpeechProcessor {
  /**
   * Analyzes real-time speech transcript to determine if user has completed their answer
   */
  analyzeTranscript(transcript: string, timeSinceLastWord: number): SpeechAnalysis {
    const words = transcript.trim().split(/\s+/)
    const wordCount = words.length

    // Get last 3 words to check for continuation signals
    const lastWords = words.slice(-3).join(" ").toLowerCase()
    const hasActiveFiller = this.hasActiveContinuationSignal(lastWords)

    const isComplete = this.detectCompletion(transcript, wordCount, timeSinceLastWord, hasActiveFiller)
    const confidence = this.calculateConfidence(transcript, wordCount, timeSinceLastWord, hasActiveFiller)

    return {
      originalText: transcript,
      hasActiveFiller,
      isComplete,
      confidence,
      wordCount,
      lastWords,
    }
  }

  /**
   * Checks if recent words indicate user is still continuing
   */
  private hasActiveContinuationSignal(lastWords: string): boolean {
    const words = lastWords.split(/\s+/)

    for (const word of words) {
      const cleanWord = word.replace(/[.,!?;:]/g, "")
      if (CONTINUATION_SIGNALS.has(cleanWord)) {
        return true
      }
    }

    return false
  }

  /**
   * Detects if the user has completed their thought/answer
   * Returns false if continuation signals are present
   */
  private detectCompletion(
    text: string,
    wordCount: number,
    timeSinceLastWord: number,
    hasActiveFiller: boolean,
  ): boolean {
    // If user just said filler/continuation word, they're NOT done
    if (hasActiveFiller && timeSinceLastWord < 3000) {
      return false
    }

    // Need minimum content to be complete
    if (wordCount < 5) return false

    // Check for explicit completion indicators
    for (const indicator of COMPLETION_INDICATORS) {
      if (indicator.test(text)) {
        return timeSinceLastWord > 1000
      }
    }

    // Check for complete sentence structure
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    if (sentences.length >= 2 && !hasActiveFiller) {
      return timeSinceLastWord > 1800
    }

    // Substantial answer with long pause and no continuation signals
    if (wordCount >= 15 && !hasActiveFiller && timeSinceLastWord > 2500) {
      return true
    }

    // Very long pause suggests completion (even with fillers)
    if (wordCount >= 10 && timeSinceLastWord > 4000) {
      return true
    }

    return false
  }

  /**
   * Calculates confidence that the user is done speaking
   * Lower confidence if continuation signals are present
   */
  private calculateConfidence(
    text: string,
    wordCount: number,
    timeSinceLastWord: number,
    hasActiveFiller: boolean,
  ): number {
    let confidence = 0

    // Active filler/continuation signals reduce confidence significantly
    if (hasActiveFiller) {
      confidence -= 0.5
    }

    // More words = higher base confidence
    if (wordCount >= 30) confidence += 0.3
    else if (wordCount >= 15) confidence += 0.2
    else if (wordCount >= 8) confidence += 0.1

    // Longer pauses = higher confidence
    if (timeSinceLastWord >= 4000) confidence += 0.5
    else if (timeSinceLastWord >= 3000) confidence += 0.4
    else if (timeSinceLastWord >= 2000) confidence += 0.3
    else if (timeSinceLastWord >= 1500) confidence += 0.2

    // Sentence endings increase confidence
    const lastChar = text.trim().slice(-1)
    if (SENTENCE_ENDERS.has(lastChar)) confidence += 0.2

    // Completion phrases increase confidence
    for (const indicator of COMPLETION_INDICATORS) {
      if (indicator.test(text)) {
        confidence += 0.3
        break
      }
    }

    return Math.max(0, Math.min(1, confidence))
  }

  /**
   * Resets the processor state for a new question
   */
  reset() {
    // Reset any state if needed in future
  }
}
