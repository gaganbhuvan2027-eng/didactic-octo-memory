// Web Worker for audio processing to keep UI responsive
let audioContext = null
const processor = null
const stream = null

self.onmessage = async (e) => {
  const { type, data } = e.data

  switch (type) {
    case "init":
      try {
        audioContext = new AudioContext({ sampleRate: 16000 })
        self.postMessage({ type: "initialized" })
      } catch (error) {
        self.postMessage({ type: "error", error: error.message })
      }
      break

    case "process":
      try {
        // Convert audio data to PCM format
        const audioData = new Float32Array(data)

        // Downsample to 16kHz for Whisper
        const downsampled = downsample(audioData, 48000, 16000)

        // Convert to 16-bit PCM
        const pcm16 = float32To16BitPCM(downsampled)

        self.postMessage(
          {
            type: "chunk",
            data: pcm16.buffer,
          },
          [pcm16.buffer],
        )
      } catch (error) {
        self.postMessage({ type: "error", error: error.message })
      }
      break

    case "stop":
      if (audioContext) {
        audioContext.close()
        audioContext = null
      }
      self.postMessage({ type: "stopped" })
      break
  }
}

function downsample(buffer, fromSampleRate, toSampleRate) {
  if (fromSampleRate === toSampleRate) {
    return buffer
  }
  const sampleRateRatio = fromSampleRate / toSampleRate
  const newLength = Math.round(buffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]
      count++
    }
    result[offsetResult] = accum / count
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
}

function float32To16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return int16Array
}
