// public/workers/ttsWorker.js

importScripts("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.0");
importScripts("/workers/sherpa-onnx-tts.js"); // Load the Sherpa-ONNX glue code

let ttsEngine = null;
let audioContext = null;

self.onmessage = async (event) => {
  const { type, text } = event.data;

  if (type === "INIT") {
    try {
      console.log("[TTS Worker] Initializing Sherpa-ONNX TTS engine...");

      // Initialize AudioContext if not already done
      if (!audioContext) {
        audioContext = new OfflineAudioContext(1, 1, 16000); // Dummy context for now, actual playback is in main thread
      }

      // Configuration for Sherpa-ONNX VITS
      const config = {
        'vits.model': './en_US-amy-medium.onnx', // Path to your ONNX model
        'vits.lexicon': './tokens.txt', // Assuming tokens.txt is also in public/workers
        'vits.tokens': './tokens.txt', // Assuming tokens.txt is also in public/workers
        'vits.data-dir': './espeak-ng-data', // Assuming espeak-ng-data is also in public/workers
        'vits.noise-scale': 0.667,
        'vits.noise-width': 0.8,
        'vits.length-scale': 1.0,
        'num-threads': 1,
        'debug': true,
      };

      // Initialize SherpaOnnxTTS
      // The SherpaOnnxTTS class is expected to be exposed by sherpa-onnx-tts.js
      ttsEngine = await SherpaOnnxTTS.create(config); // Assuming create is an async static method
      console.log("[TTS Worker] Sherpa-ONNX TTS engine initialized.");
      self.postMessage({ type: "READY" });
    } catch (error) {
      console.error("[TTS Worker] Failed to initialize Sherpa-ONNX TTS engine:", error);
      self.postMessage({ type: "ERROR", error: error.message });
    }
  } else if (type === "SPEAK") {
    if (!ttsEngine) {
      self.postMessage({ type: "ERROR", error: "TTS engine not initialized" });
      return;
    }
    try {
      const audioSamples = await ttsEngine.generate({
        text: text,
        speed: 1.0, // Adjust speed as needed
      });

      // Sherpa-ONNX usually returns Float32Array or similar raw audio samples
      self.postMessage({ type: "AUDIO_CHUNK", audioBuffer: audioSamples.samples });
    } catch (error) {
      console.error("[TTS Worker] Failed to synthesize speech:", error);
      self.postMessage({ type: "ERROR", error: error.message });
    }
  }
};
