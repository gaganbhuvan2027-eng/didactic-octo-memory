// Voice Activity Detection using Web Audio API
export class VoiceActivityDetector {
  private audioContext: AudioContext
  private analyser: AnalyserNode
  private dataArray: Uint8Array
  private threshold: number
  private silenceThreshold: number
  private silenceDuration: number
  private lastSoundTime: number
  private isActive: boolean

  constructor(
    threshold = 30, // Volume threshold for speech detection
    silenceThreshold = 1500, // ms of silence before stopping
  ) {
    this.audioContext = new AudioContext()
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 512
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.threshold = threshold
    this.silenceThreshold = silenceThreshold
    this.silenceDuration = 0
    this.lastSoundTime = Date.now()
    this.isActive = false
  }

  async initialize(stream: MediaStream): Promise<void> {
    const source = this.audioContext.createMediaStreamSource(stream)
    source.connect(this.analyser)
    this.isActive = true
  }

  getVolume(): number {
    this.analyser.getByteFrequencyData(this.dataArray)
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i]
    }
    return sum / this.dataArray.length
  }

  isSpeaking(): boolean {
    const volume = this.getVolume()
    const speaking = volume > this.threshold

    if (speaking) {
      this.lastSoundTime = Date.now()
      this.silenceDuration = 0
    } else {
      this.silenceDuration = Date.now() - this.lastSoundTime
    }

    return speaking
  }

  hasBeenSilent(): boolean {
    return this.silenceDuration > this.silenceThreshold
  }

  reset(): void {
    this.lastSoundTime = Date.now()
    this.silenceDuration = 0
  }

  destroy(): void {
    this.isActive = false
    if (this.audioContext.state !== "closed") {
      this.audioContext.close()
    }
  }
}
