# Voice Transcript Carryover Fix

## Problems Fixed

### 1. Transcript Carryover Issue
**Problem**: Words from the previous answer were being included in the next answer. When the AI asked a new question, leftover words from the previous response would be sent as part of the new answer.

**Root Cause**: The transcript was not being properly cleared when the AI started speaking a new question.

**Solution**: Added automatic transcript clearing when AI starts speaking.

### 2. No Manual Override
**Problem**: Users had no way to manually indicate they were done speaking if the automatic detection failed.

**Solution**: Added a "Done Speaking" button that appears when the user has spoken at least 5 words.

## Changes Made

### 1. Transcript Clearing on AI Speech (`hooks/use-voice-agent.ts`)

Added automatic cleanup when AI starts speaking to prevent carryover:

**A. Ignore speech recognition results while AI is speaking:**
```typescript
recognition.onresult = async (event: any) => {
  // Ignore results if AI is speaking to prevent carryover
  if (isAISpeakingRef.current) {
    console.log("[v0] Ignoring speech recognition result - AI is speaking")
    return
  }
  // ... rest of the logic
}
```

**B. Stop and restart recognition when AI starts speaking:**
```typescript
const setAISpeaking = useCallback((speaking: boolean) => {
  const wasAISpeaking = isAISpeakingRef.current
  isAISpeakingRef.current = speaking
  
  if (speaking && !wasAISpeaking) {
    // Stop recognition to clear buffered results
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop()
    }
    
    // Clear all transcript data
    transcriptRef.current = ""
    setLiveTranscript("")
    setCurrentAnalysis(null)
    hasStartedSpeakingRef.current = false
    
    // Restart recognition after 100ms for clean slate
    setTimeout(() => {
      if (recognitionRef.current && isListeningRef.current && !isAISpeakingRef.current) {
        recognitionRef.current.start()
      }
    }, 100)
  }
}, [])
```

**Impact**: 
- ✅ Speech recognition results are ignored while AI speaks
- ✅ Recognition is stopped and restarted for clean slate
- ✅ Transcript is completely cleared
- ✅ No carryover words from previous answers
- ✅ Clean slate for each new question

### 2. Manual Submit Function (`hooks/use-voice-agent.ts`)

Added a manual submit function that users can trigger:

```typescript
const manualSubmit = useCallback(async () => {
  console.log("[v0] Manual submit triggered")
  
  // Clear any pending silence timer
  if (silenceTimerRef.current) {
    clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = null
  }

  const finalText = transcriptRef.current.trim()
  if (finalText && hasStartedSpeakingRef.current && finalText.split(/\s+/).length >= 3) {
    console.log("[v0] Manual submit - performing final LLM check...")
    const finalAnalysis = await analyzeTranscriptWithLLM(finalText, currentQuestion)
    
    onUserSpeechEndRef.current(finalText, finalAnalysis)
    transcriptRef.current = ""
    setLiveTranscript("")
    setCurrentAnalysis(null)
    hasStartedSpeakingRef.current = false
  }
}, [currentQuestion])
```

**Impact**:
- ✅ Users can manually submit their answer
- ✅ Bypasses automatic detection when needed
- ✅ Provides control to the user

### 3. Manual Submit Button UI (`components/audio-video-interviewer.tsx`)

Added a "Done Speaking" button that appears during listening:

```typescript
{voiceAgent.liveTranscript && voiceAgent.liveTranscript.split(/\s+/).length >= 5 && (
  <button
    onClick={() => voiceAgent.manualSubmit()}
    className="mt-2 px-4 py-2 bg-green-600 text-white text-xs md:text-sm rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg"
    title="Click if you're done speaking"
  >
    <svg>...</svg>
    Done Speaking
  </button>
)}
```

**Features**:
- Only appears when user has spoken 5+ words
- Green color to match "Listening" state
- Clear icon and label
- Tooltip: "Click if you're done speaking"
- Smooth hover animation

**Impact**:
- ✅ Visible backup option for users
- ✅ Only shows when relevant (after 5 words)
- ✅ Clear and intuitive UI

## User Experience Flow

### Normal Flow (Automatic Detection)
1. User starts speaking
2. System shows "Listening..." with audio orb
3. User finishes speaking
4. After 2.5s of silence, system automatically submits
5. System processes and AI responds

### Manual Override Flow
1. User starts speaking
2. System shows "Listening..." with audio orb
3. After 5 words, "Done Speaking" button appears
4. User clicks button when finished
5. System immediately submits (no waiting)
6. System processes and AI responds

### Transcript Cleanup
1. User finishes answer
2. System processes answer
3. AI starts speaking new question
4. **Transcript is automatically cleared** ← Prevents carryover
5. Clean slate for next answer

## Benefits

1. ✅ **No More Carryover**: Each answer starts fresh
2. ✅ **User Control**: Manual submit button as backup
3. ✅ **Better UX**: Users feel in control of the conversation
4. ✅ **Reliability**: Works even if automatic detection fails
5. ✅ **Clear Feedback**: Button only appears when relevant

## Testing Recommendations

1. Test that transcript clears between questions
2. Test manual submit button appears after 5 words
3. Test manual submit immediately processes answer
4. Test automatic detection still works
5. Test that no words carry over to next question
6. Test on mobile and desktop

