# Integrate Self-Hosted Coqui TTS

## Goal
Use a self-hosted Coqui TTS HTTP endpoint for all TTS calls, removing Deepgram/Google fallbacks.

## Changes
1) TTS API route rewrite
- File: `app/api/tts/route.ts`
- Replace current Deepgram/Google flow with a single POST to a configurable Coqui endpoint.
- Config via env: `COQUI_TTS_URL` (required), optional `COQUI_VOICE`, `COQUI_SAMPLE_RATE`.
- Accept `voice` in request body to override default.
- Stream not required; simple binary response OK.

2) Env docs
- File: `README.md` (or add a short note to `.env.local.example` if present)
- Document required env: `COQUI_TTS_URL`, optional `COQUI_VOICE`, `COQUI_SAMPLE_RATE`.

3) Safety / limits
- Keep existing payload validation and rate limiting in `app/api/tts/route.ts`.
- Add short timeout on fetch to TTS server.

## Steps
1. Update TTS route to call Coqui endpoint using env-configured URL, remove Deepgram/Google branches.
2. Add/adjust env notes for Coqui variables.
3. Verify lints.

