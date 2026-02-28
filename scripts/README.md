# Scripts

## First-time test user

Create a test account that the app treats as a first-time user (onboarding, interview tour, etc.):

```bash
node scripts/create-firsttime-test-user.js
```

**Credentials:**
- Email: `firsttime@mockzen.test`
- Password: `Test1234!`

To reset and test again: run the script again. If the interview tour doesn't appear (e.g. after switching accounts), clear localStorage keys `mockzen_interview_tour_seen*` in DevTools (Application → Local Storage).

---

# In-process integration tests

This folder contains an in-process test that exercises batch member flows using Supabase REST API directly (no HTTP server required).

How to run locally:

- Ensure `.env.local` contains SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- Run:

  npm run test:integration

CI:
- A GitHub Actions workflow `.github/workflows/in-process-tests.yml` runs the test on push/pull_request.
- Configure the following repository secrets: `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Notes:
- Tests create test users and a batch; they clean up batch and batch_members but not the created users (to avoid accidental removal of real users). You can re-run safely but consider rotating test accounts occasionally.
