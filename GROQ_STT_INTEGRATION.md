# Groq STT Integration with Whisper Large v3 Turbo

## Overview

This project now uses **Groq's Whisper Large v3 Turbo** for high-quality speech-to-text transcription. This provides significantly better accuracy compared to browser-based speech recognition, especially for college/educational applications.

## ✅ ACTIVE INTEGRATION

The main interview system (`audio-video-interviewer.tsx`) now uses `useVoiceAgentGroq` which integrates Groq Whisper Large v3 Turbo for all speech-to-text operations.

## Features

- ✅ **High Accuracy**: Whisper Large v3 Turbo provides superior transcription quality
- ✅ **Real-time Processing**: ~216x real-time speed factor
- ✅ **Multimodal Detection**: Combines audio + visual (lip movement) detection
- ✅ **Automatic Recording**: Only records when user is actually speaking
- ✅ **Secure**: API key is kept server-side, not exposed to client
- ✅ **Cost Effective**: $0.04 per hour of audio transcribed

## Setup

### 1. Environment Variables

Make sure your `.env.local` file includes:

```bash
GROQ_API_KEY=gsk_your_api_key_here
```

You can get your API key from: https://console.groq.com/keys

### 2. How It Works

The integration consists of three main components:

#### A. API Route (`app/api/transcribe/route.ts`)
- Securely handles Groq API calls server-side
- Forwards audio files to Groq's Whisper API
- Returns transcribed text to the client

#### B. Hook (`hooks/use-multimodal-speech-detection.ts`)
- Detects when user starts/stops speaking using audio + video analysis
- Automatically records audio during speech
- Sends recorded audio to the transcription API
- Returns transcribed text

#### C. Usage in Components

```typescript
import { useMultimodalSpeechDetection } from '@/hooks/use-multimodal-speech-detection'

function InterviewComponent() {
  const {
    isSpeaking,
    isDetecting,
    isTranscribing,
    transcription,
    startDetection,
    stopDetection,
  } = useMultimodalSpeechDetection({
    onSpeechStart: () => console.log('User started speaking'),
    onSpeechEnd: () => console.log('User stopped speaking'),
    onTranscription: (text) => console.log('Transcribed:', text),
    audioThreshold: 25,      // Sensitivity for audio detection
    silenceDuration: 2500,   // ms of silence before stopping
    motionThreshold: 5,      // Sensitivity for lip movement
  })

  // Start detection with media stream and video element
  const handleStart = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: true 
    })
    const videoElement = document.querySelector('video')
    startDetection(stream, videoElement)
  }

  return (
    <div>
      <button onClick={handleStart}>Start Interview</button>
      <button onClick={stopDetection}>Stop Interview</button>
      
      {isSpeaking && <p>🎤 Listening...</p>}
      {isTranscribing && <p>⏳ Transcribing...</p>}
      {transcription && <p>You said: {transcription}</p>}
    </div>
  )
}
```

## Key Features of Groq Voice Agent

### 1. **No Carryover Issues**
- ✅ Recording stops IMMEDIATELY when AI starts speaking
- ✅ Audio chunks are cleared to prevent processing AI speech
- ✅ Clean separation between user speech and AI speech
- ✅ No more "last words from previous answer" bleeding into next question

### 2. **Proper Recording Management**
- ✅ MediaRecorder only starts when speech is detected (VAD-based)
- ✅ Stops recording after 1.5 seconds of silence
- ✅ Auto-stops after 30 seconds (safety limit)
- ✅ Uses timeslices (100ms) for better chunk management
- ✅ Proper error handling for MediaRecorder

### 3. **Security**
- ✅ API key kept server-side only
- ✅ Transcription goes through Next.js API route
- ✅ No client-side exposure of credentials

### 4. **Better State Management**
- ✅ Added `isTranscribing` state to show loading
- ✅ Proper cleanup of resources
- ✅ Stream reference stored for MediaRecorder access
- ✅ Voice Activity Detection (VAD) for automatic recording

### 5. **Audio Quality**
- ✅ Only transcribes audio > 1KB (filters out noise)
- ✅ Uses audio/webm format (widely supported)
- ✅ Proper MIME type handling
- ✅ Configurable audio threshold for VAD

### 6. **Debugging**
- ✅ Comprehensive logging with `[Groq Voice Agent]` prefix
- ✅ Audio blob size logging
- ✅ Error details logged
- ✅ Transcription success/failure tracking
- ✅ Recording state tracking

## API Costs

- **Pricing**: $0.04 per hour of audio transcribed
- **Example**: 100 interviews × 30 minutes each = 50 hours = $2.00

## Performance

- **Speed**: ~216x real-time (a 1-minute audio transcribes in ~0.28 seconds)
- **Latency**: Not a concern for college applications
- **Accuracy**: Superior to browser-based speech recognition

## How the Carryover Issue Was Fixed

The previous implementation using browser-based Speech Recognition API had a critical issue where the last words from the AI's response would bleed into the next user response. This happened because:

1. **Browser Speech Recognition is always listening** - Even when stopped, it has buffered audio
2. **Async stop operation** - The stop command doesn't immediately halt recognition
3. **Result events can fire after stop** - Buffered results continue to process

### Our Solution with Groq Whisper:

1. **Discrete Recording Sessions** - Each user utterance is a separate recording
2. **Immediate Stop on AI Speech** - When AI starts speaking:
   ```typescript
   if (speaking && !wasAISpeaking) {
     // Stop recording immediately
     mediaRecorderRef.current.stop()
     // Clear audio chunks to prevent processing AI speech
     audioChunksRef.current = []
     isRecordingRef.current = false
   }
   ```
3. **VAD-Based Recording** - Only records when user is actually speaking (detected via audio level)
4. **Clean State Management** - All transcripts and state cleared when AI starts speaking

This ensures **zero carryover** between questions and answers.

## Troubleshooting

### No transcription appearing?

1. Check browser console for `[Groq STT]` logs
2. Verify `GROQ_API_KEY` is set in environment variables
3. Ensure audio is being recorded (check blob size in logs)
4. Check if audio is > 1KB (too short audio is skipped)

### API errors?

1. Verify API key format starts with `gsk_`
2. Check Groq API status: https://status.groq.com
3. Review server logs in terminal for detailed errors

### Recording not starting?

1. Ensure both audio AND visual detection are working
2. Check `audioThreshold` and `motionThreshold` settings
3. Verify camera and microphone permissions are granted

## Migration from Browser Speech Recognition

The main interview component (`audio-video-interviewer.tsx`) has been migrated from `useVoiceAgent` (browser-based) to `useVoiceAgentGroq` (Groq Whisper-based).

**Before:**
```typescript
import { useVoiceAgent } from "@/hooks/use-voice-agent"

const voiceAgent = useVoiceAgent({
  onUserSpeechEnd: (transcript, analysis) => { ... }
})
```

**After:**
```typescript
import { useVoiceAgentGroq } from "@/hooks/use-voice-agent-groq"

const voiceAgent = useVoiceAgentGroq({
  onUserSpeechEnd: (transcript, analysis) => { ... }
})
```

The API is identical, so no other changes are needed. The hook now uses Groq Whisper Large v3 Turbo instead of browser speech recognition.

## Additional Resources

- [Groq Documentation](https://console.groq.com/docs/speech-to-text)
- [Whisper Model Info](https://groq.com/whisper-large-v3-turbo-now-available-on-groq-combining-speed-quality-for-speech-recognition)
- [API Pricing](https://groq.com/pricing)

---

**Note**: This integration is specifically optimized for interview scenarios where accuracy is more important than real-time streaming. The system waits for complete utterances before transcribing, ensuring higher quality results.

