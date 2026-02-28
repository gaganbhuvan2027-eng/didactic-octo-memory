// Real-time audio playback using AudioContext
export class StreamingAudioPlayer {
  private audioContext: AudioContext
  private gainNode: GainNode
  private nextStartTime: number
  private isPlaying: boolean
  private audioQueue: AudioBuffer[]

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 24000 })
    this.gainNode = this.audioContext.createGain()
    this.gainNode.connect(this.audioContext.destination)
    this.nextStartTime = 0
    this.isPlaying = false
    this.audioQueue = []
  }

  async playChunk(pcmData: Float32Array): Promise<void> {
    // Create audio buffer from PCM data
    const audioBuffer = this.audioContext.createBuffer(
      1, // mono
      pcmData.length,
      this.audioContext.sampleRate,
    )
    audioBuffer.copyToChannel(pcmData, 0)

    this.audioQueue.push(audioBuffer)

    if (!this.isPlaying) {
      this.isPlaying = true
      this.playQueue()
    }
  }

  private playQueue(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false
      return
    }

    const audioBuffer = this.audioQueue.shift()!
    const source = this.audioContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.gainNode)

    const currentTime = this.audioContext.currentTime
    const startTime = Math.max(currentTime, this.nextStartTime)

    source.start(startTime)
    this.nextStartTime = startTime + audioBuffer.duration

    source.onended = () => {
      this.playQueue()
    }
  }

  stop(): void {
    this.audioQueue = []
    this.isPlaying = false
    this.nextStartTime = 0
  }

  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
  }

  destroy(): void {
    this.stop()
    if (this.audioContext.state !== "closed") {
      this.audioContext.close()
    }
  }
}
