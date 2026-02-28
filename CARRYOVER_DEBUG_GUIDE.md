# Debugging User Transcript Carryover Issue

## The Problem

User's last words from their previous answer are bleeding into their next response.

Example:
- User answers Q1: "I think JavaScript is great for web development"
- AI asks Q2
- User's response to Q2 starts with: "for web development [new answer]"

## Root Causes to Check

### 1. Audio Chunks Not Cleared
- `audioChunksRef.current` may contain data from previous recording
- **Fix Applied**: Clear in `startRecording()` and after AI speaks

### 2. Transcript State Not Reset
- `transcriptRef.current` may retain old text
- **Fix Applied**: Clear in `startRecording()` and `setAISpeaking()`

### 3. MediaRecorder State Issues
- Previous MediaRecorder may not be fully stopped
- New recording starts before old one finishes
- **Fix Applied**: Check state before starting new recording

### 4. Timing Issues
- Recording starts too quickly after AI finishes speaking
- AI's last words still in audio buffer
- **Fix Applied**: Clear everything when AI stops speaking

## Debugging Steps

### Step 1: Check Console Logs

When testing, look for these log sequences:

**Good Sequence (No Carryover):**
```
[Groq Voice Agent] AI stopped speaking - resetting for next user turn
[Groq Voice Agent] Speech detected, starting recording
[Groq Voice Agent] Current transcript before recording: ""  ← SHOULD BE EMPTY
[Groq Voice Agent] Audio chunks before recording: 0        ← SHOULD BE 0
[Groq Voice Agent] Recording started
[Groq Voice Agent] Silence detected, stopping recording
[Groq Voice Agent] Recording stopped, processing...
[Groq Voice Agent] Processing audio blob, size: XXXX
[Groq Voice Agent] NEW transcription (should be clean): "your new answer"
```

**Bad Sequence (Carryover Detected):**
```
[Groq Voice Agent] Speech detected, starting recording
[Groq Voice Agent] Current transcript before recording: "old text"  ← NOT EMPTY!
[Groq Voice Agent] Audio chunks before recording: 5                 ← NOT ZERO!
```

### Step 2: Test Scenario

1. Start interview
2. Answer first question: "My name is John and I love programming"
3. Wait for AI to ask second question
4. **Before speaking**, check console - should see "AI stopped speaking - resetting"
5. Answer second question: "I have 5 years of experience"
6. Check the transcription - should NOT contain "programming" or any words from Q1

### Step 3: Verify State Clearing

Add this temporary code to check state:

```typescript
// In audio-video-interviewer.tsx, add this after voiceAgent initialization:
useEffect(() => {
  const interval = setInterval(() => {
    console.log("[DEBUG] Voice Agent State:", {
      isListening: voiceAgent.isListening,
      liveTranscript: voiceAgent.liveTranscript,
    })
  }, 2000)
  return () => clearInterval(interval)
}, [voiceAgent])
```

## Fixes Applied

### Fix 1: Clear State on Recording Start
```typescript
const startRecording = useCallback(() => {
  // CRITICAL: Clear all previous state before starting new recording
  audioChunksRef.current = []
  transcriptRef.current = ""
  setLiveTranscript("")
  setCurrentAnalysis(null)
  // ... rest of recording setup
})
```

### Fix 2: Clear State When AI Stops Speaking
```typescript
if (!speaking && wasAISpeaking) {
  console.log("[Groq Voice Agent] AI stopped speaking - resetting for next user turn")
  
  // CRITICAL: Clear everything to ensure no carryover
  transcriptRef.current = ""
  setLiveTranscript("")
  setCurrentAnalysis(null)
  hasStartedSpeakingRef.current = false
  audioChunksRef.current = []
  isRecordingRef.current = false
  // ... clear timers
}
```

### Fix 3: Clear State After Processing
```typescript
if (hasStartedSpeakingRef.current) {
  onUserSpeechEndRef.current(transcribedText.trim(), analysis)
  // CRITICAL: Clear everything after sending to prevent carryover
  transcriptRef.current = ""
  setLiveTranscript("")
  setCurrentAnalysis(null)
  hasStartedSpeakingRef.current = false
}
audioChunksRef.current = []
```

## If Issue Persists

### Check 1: MediaRecorder State
The MediaRecorder might not be fully stopped. Check if:
- `mediaRecorderRef.current.state === "inactive"` before starting new recording
- Add delay between stop and start if needed

### Check 2: Audio Buffer
Browser audio buffer might retain data. Try:
- Increase delay after AI stops speaking
- Add explicit buffer clear

### Check 3: Component State
The component might be accumulating transcripts. Check:
- `handleProcessUserResponse` is receiving clean transcript
- `lastProcessedResponseRef` is working correctly

### Check 4: Multiple Recordings
Multiple recordings might be happening simultaneously. Verify:
- Only one recording active at a time
- `isRecordingRef.current` is properly managed

## Testing Checklist

- [ ] Console shows "Current transcript before recording: ''" (empty)
- [ ] Console shows "Audio chunks before recording: 0" (zero)
- [ ] Console shows "AI stopped speaking - resetting" between questions
- [ ] New transcription doesn't contain words from previous answer
- [ ] `liveTranscript` state is empty before new recording
- [ ] No multiple "Recording started" logs without "Recording stopped"

## Additional Monitoring

Add these logs temporarily:

```typescript
// In startRecording
console.log("[DEBUG] Starting new recording")
console.log("[DEBUG] - transcriptRef:", transcriptRef.current)
console.log("[DEBUG] - audioChunks:", audioChunksRef.current.length)
console.log("[DEBUG] - hasStartedSpeaking:", hasStartedSpeakingRef.current)
console.log("[DEBUG] - isRecording:", isRecordingRef.current)
console.log("[DEBUG] - isAISpeaking:", isAISpeakingRef.current)
```

## Expected Behavior

1. User answers Q1 → transcript sent → state cleared
2. AI speaks Q2 → `setAISpeaking(true)` → all state cleared
3. AI finishes Q2 → `setAISpeaking(false)` → all state cleared again
4. User starts speaking → recording starts with EMPTY state
5. User finishes → transcription contains ONLY new answer

## Success Criteria

✅ No words from previous answer appear in new transcription
✅ Console logs show empty state before each new recording
✅ Each recording is independent and isolated
✅ State is cleared at multiple checkpoints

