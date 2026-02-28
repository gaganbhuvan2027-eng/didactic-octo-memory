# Audio Sensitivity Testing Guide

## Quick Test Instructions

### 1. Basic Functionality Test

1. **Start the application** and navigate to an interview setup page
2. **Click "Test Mic"** button
3. **Observe**:
   - ✅ Microphone permission is requested
   - ✅ "Calibrating..." indicator appears briefly
   - ✅ Microphone test succeeds with green checkmark
   - ✅ Audio level bar appears and responds to sound
   - ✅ Sensitivity slider appears with a value (usually 30-70%)

### 2. Calibration Test

1. **In a quiet room**:
   - Test mic - should calibrate to ~60-80% sensitivity
   - Console should show: `[Mic Calibration] Complete: { threshold: 20-30, deviceProfile: 'sensitive' or 'very-sensitive' }`

2. **In a noisy room** (fan, traffic, etc):
   - Test mic - should calibrate to ~30-50% sensitivity
   - Console should show higher threshold (40-60)

3. **With a quiet/budget mic**:
   - Should calibrate to ~20-40% sensitivity
   - Console should show higher threshold (50-70)

### 3. Sensitivity Adjustment Test

With mic test active:

1. **Speak normally** - green bar should fill and show "✓ Voice Detected"
2. **Be silent** - bar should drop below the red threshold line
3. **Adjust slider left** (less sensitive):
   - Threshold line moves right
   - Harder to trigger voice detection
   - Good for noisy environments
4. **Adjust slider right** (more sensitive):
   - Threshold line moves left
   - Easier to trigger voice detection
   - Good for quiet mics

### 4. Persistence Test

1. **Test mic** and adjust sensitivity to 75%
2. **Reload the page**
3. **Test mic again**
4. ✅ Should remember ~75% setting
5. Console should show: `[v0] Loaded saved calibration`

### 5. Cross-Device Test

Test on different devices:

| Device Type | Expected Behavior |
|------------|-------------------|
| MacBook Pro | Auto-calibrates to 60-80% (very sensitive) |
| Windows Laptop | Auto-calibrates to 40-60% (normal) |
| Budget Webcam | Auto-calibrates to 20-40% (quiet) |
| Gaming Headset | Auto-calibrates to 70-85% (sensitive) |
| Bluetooth Earbuds | Auto-calibrates to 30-50% (varies) |

### 6. Interview Test

1. **Complete mic test** with calibration
2. **Start an interview**
3. **Answer a question** naturally
4. ✅ Voice should be detected when speaking
5. ✅ Should NOT detect during pauses
6. ✅ Should NOT trigger on background noise
7. Check console for: `[Groq Voice Agent] 🗣️ Speaking... Level: XX`

### 7. Edge Cases

#### Test A: Very Noisy Environment
1. Turn on loud music or fan
2. Test mic - should show high ambient noise
3. Speak louder than the noise
4. ✅ Should detect speech but not constant noise

#### Test B: Very Quiet Mic
1. Use a device with poor/distant mic
2. Test mic - should detect as "quiet" or "very-quiet" profile
3. Speak at normal volume
4. ✅ Should still detect (gain compensation helps)

#### Test C: Rapid Speaking
1. Start interview
2. Answer question quickly without pauses
3. ✅ Should capture entire response
4. ✅ Should not cut off mid-sentence

#### Test D: Hesitations and Fillers
1. Answer with "um", "uh", pauses
2. ✅ Should continue listening during fillers
3. ✅ Should end detection after actual silence

## Expected Console Output

### Successful Calibration
```
[v0] Testing microphone...
[v0] Microphone access granted
[v0] Auto-calibrating microphone...
[Mic Calibration] Complete: {
  threshold: 35,
  ambientNoise: 12,
  peakLevel: 28,
  recommendedGain: 1.0,
  deviceProfile: 'normal'
}
[v0] Calibration complete: {...}
[Mic Calibration] Saved to localStorage
[v0] Microphone test successful
```

### Loading Saved Calibration
```
[v0] Loaded saved calibration: {
  threshold: 35,
  ambientNoise: 12,
  ...
}
[v0] Sensitivity: 55 -> Threshold: 35
```

### During Interview
```
[Groq Voice Agent] 🎤 Starting microphone...
[Groq Voice Agent] ✅ Mic ready
[Groq Voice Agent] 🗣️ Speaking... Level: 42
[Groq Voice Agent] ⏸️ Silence detected...
```

## Troubleshooting Test Failures

### Issue: Calibration not running
- **Check**: Look for "Calibrating..." text
- **Debug**: Check console for errors
- **Fix**: Clear localStorage and try again

### Issue: Sensitivity not persisting
- **Check**: Browser localStorage enabled
- **Debug**: Check browser console for storage errors
- **Fix**: Not in incognito mode

### Issue: Voice not detected
- **Check**: Audio level bar moves when speaking
- **Debug**: Console shows audio levels
- **Fix**: Increase sensitivity slider

### Issue: Too sensitive (background noise triggers)
- **Check**: Red threshold line position
- **Debug**: Monitor ambient audio level
- **Fix**: Decrease sensitivity slider

## Acceptance Criteria

Before marking as complete, verify:

- [ ] ✅ Auto-calibration runs on first mic test
- [ ] ✅ Calibration result saved to localStorage
- [ ] ✅ Sensitivity slider appears and is functional
- [ ] ✅ Visual feedback shows real-time audio levels
- [ ] ✅ Threshold marker (red line) visible and moves with slider
- [ ] ✅ Settings persist after page reload
- [ ] ✅ Works in actual interview (not just test)
- [ ] ✅ Works on at least 2 different devices
- [ ] ✅ No console errors during normal operation
- [ ] ✅ Graceful fallback if calibration fails

## Performance Checks

- [ ] Calibration completes in < 3 seconds
- [ ] No lag when adjusting sensitivity slider
- [ ] No audio dropouts during interview
- [ ] CPU usage normal (< 5% for audio processing)
- [ ] Memory usage stable (no leaks)

## Browser Compatibility Check

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)
- [ ] Mobile browsers (if applicable)

## Final Sign-Off

Once all tests pass, the audio sensitivity issue should be resolved across devices. Users should have:
1. Automatic calibration for their device
2. Manual control via sensitivity slider
3. Visual feedback for confidence
4. Persistent settings for convenience

**Status**: 🟢 Ready for production

