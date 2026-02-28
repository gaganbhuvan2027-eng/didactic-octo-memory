/**
 * Microphone Calibration Utilities
 * Handles auto-calibration and adaptive audio threshold detection
 * for devices with varying microphone sensitivities
 */

export interface CalibrationResult {
  threshold: number
  ambientNoise: number
  peakLevel: number
  recommendedGain: number
  deviceProfile: 'very-sensitive' | 'sensitive' | 'normal' | 'quiet' | 'very-quiet'
}

/**
 * Calibrates microphone by analyzing ambient noise levels
 * @param analyser - Web Audio API AnalyserNode
 * @param dataArray - Uint8Array for frequency data
 * @param durationMs - Calibration duration in milliseconds (default: 2000ms)
 * @returns CalibrationResult with recommended threshold and settings
 */
export async function calibrateMicrophone(
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  durationMs: number = 2000
): Promise<CalibrationResult> {
  const samples: number[] = []
  const sampleInterval = 50 // Sample every 50ms
  const totalSamples = Math.floor(durationMs / sampleInterval)
  
  return new Promise((resolve) => {
    let sampleCount = 0
    
    const collectSample = () => {
      analyser.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      samples.push(average)
      sampleCount++
      
      if (sampleCount < totalSamples) {
        setTimeout(collectSample, sampleInterval)
      } else {
        // Analysis complete
        const result = analyzeSamples(samples)
        console.log('[Mic Calibration] Complete:', result)
        resolve(result)
      }
    }
    
    collectSample()
  })
}

/**
 * Analyzes collected audio samples to determine optimal settings
 */
function analyzeSamples(samples: number[]): CalibrationResult {
  // Sort samples to find percentiles
  const sortedSamples = [...samples].sort((a, b) => a - b)
  
  // Calculate statistics
  const median = sortedSamples[Math.floor(samples.length / 2)]
  const p90 = sortedSamples[Math.floor(samples.length * 0.9)]
  const p95 = sortedSamples[Math.floor(samples.length * 0.95)]
  const max = Math.max(...samples)
  const average = samples.reduce((a, b) => a + b, 0) / samples.length
  
  // Ambient noise is the median of all samples
  const ambientNoise = median
  
  // Peak level during calibration (likely includes some speech/noise)
  const peakLevel = p95
  
  // Determine device profile based on ambient noise levels
  let deviceProfile: CalibrationResult['deviceProfile']
  let baseThreshold: number
  let recommendedGain: number
  
  if (ambientNoise < 10) {
    // Very sensitive mic or very quiet environment
    deviceProfile = 'very-sensitive'
    baseThreshold = Math.max(15, ambientNoise * 3)
    recommendedGain = 0.8
  } else if (ambientNoise < 20) {
    // Sensitive mic or quiet environment
    deviceProfile = 'sensitive'
    baseThreshold = Math.max(25, ambientNoise * 2.5)
    recommendedGain = 0.9
  } else if (ambientNoise < 35) {
    // Normal mic sensitivity
    deviceProfile = 'normal'
    baseThreshold = Math.max(35, ambientNoise * 2)
    recommendedGain = 1.0
  } else if (ambientNoise < 50) {
    // Quiet mic or noisy environment
    deviceProfile = 'quiet'
    baseThreshold = Math.max(45, ambientNoise * 1.5)
    recommendedGain = 1.2
  } else {
    // Very quiet mic or very noisy environment
    deviceProfile = 'very-quiet'
    baseThreshold = Math.max(55, ambientNoise * 1.3)
    recommendedGain = 1.5
  }
  
  // Ensure threshold is within reasonable bounds
  const threshold = Math.min(80, Math.max(15, baseThreshold))
  
  return {
    threshold,
    ambientNoise,
    peakLevel,
    recommendedGain,
    deviceProfile,
  }
}

/**
 * Saves calibration result to localStorage
 */
export function saveCalibration(result: CalibrationResult): void {
  try {
    localStorage.setItem('mic_calibration', JSON.stringify({
      ...result,
      timestamp: Date.now(),
    }))
    console.log('[Mic Calibration] Saved to localStorage')
  } catch (error) {
    console.error('[Mic Calibration] Failed to save:', error)
  }
}

/**
 * Loads saved calibration from localStorage
 * @param maxAgeMs - Maximum age of calibration in milliseconds (default: 7 days)
 * @returns CalibrationResult or null if not found or expired
 */
export function loadCalibration(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): CalibrationResult | null {
  try {
    const saved = localStorage.getItem('mic_calibration')
    if (!saved) return null
    
    const data = JSON.parse(saved)
    const age = Date.now() - (data.timestamp || 0)
    
    if (age > maxAgeMs) {
      console.log('[Mic Calibration] Expired, recalibration needed')
      return null
    }
    
    console.log('[Mic Calibration] Loaded from localStorage:', data)
    return {
      threshold: data.threshold,
      ambientNoise: data.ambientNoise,
      peakLevel: data.peakLevel,
      recommendedGain: data.recommendedGain,
      deviceProfile: data.deviceProfile,
    }
  } catch (error) {
    console.error('[Mic Calibration] Failed to load:', error)
    return null
  }
}

/**
 * Converts sensitivity percentage (0-100) to audio threshold
 * Higher sensitivity = lower threshold (picks up quieter sounds)
 */
export function sensitivityToThreshold(sensitivity: number, baseThreshold: number = 40): number {
  // Sensitivity 50 = baseThreshold
  // Sensitivity 100 = 15 (most sensitive)
  // Sensitivity 0 = 80 (least sensitive)
  
  const minThreshold = 15
  const maxThreshold = 80
  
  // Linear interpolation
  const range = maxThreshold - minThreshold
  const normalized = (100 - sensitivity) / 100 // Invert: high sensitivity = low threshold
  const threshold = minThreshold + (range * normalized)
  
  return Math.round(threshold)
}

/**
 * Converts audio threshold to sensitivity percentage (0-100)
 */
export function thresholdToSensitivity(threshold: number): number {
  const minThreshold = 15
  const maxThreshold = 80
  
  const normalized = (threshold - minThreshold) / (maxThreshold - minThreshold)
  const sensitivity = (1 - normalized) * 100
  
  return Math.round(Math.max(0, Math.min(100, sensitivity)))
}

