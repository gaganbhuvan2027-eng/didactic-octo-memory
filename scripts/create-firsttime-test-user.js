#!/usr/bin/env node
/**
 * Creates a first-time test user for debugging and testing.
 * The app will treat this user as new: onboarding flow, interview tour, etc.
 *
 * Usage: node scripts/create-firsttime-test-user.js
 * Or:    npx dotenv -e .env.local -- node scripts/create-firsttime-test-user.js
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Credentials (use these to log in):
 *   Email:    firsttime@mockzen.test
 *   Password: Test1234!
 *
 * To test again as first-time: run this script again (it resets the user).
 * Also clear localStorage keys starting with "mockzen_interview_tour_seen" in DevTools.
 */

const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

const TEST_EMAIL = "firsttime@mockzen.test"
const TEST_PASSWORD = "Test1234!"
const FIRST_TIME_PREFS = {
  onboarding_completed: false,
  interview_tour_seen: false,
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
    process.exit(1)
  }

  const admin = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log("Creating/resetting first-time test user...")

  // Check if user exists
  const { data: existingUsers } = await admin.auth.admin.listUsers()
  const existing = existingUsers?.users?.find((u) => u.email === TEST_EMAIL)

  let userId
  if (existing) {
    userId = existing.id
    console.log("User exists, resetting to first-time state...")
    await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD })
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "First Time Tester" },
    })
    if (error) {
      console.error("Failed to create user:", error.message)
      process.exit(1)
    }
    userId = data.user.id
    console.log("Created new test user.")
  }

  // Upsert users table with first-time preferences
  const { data: existingRow } = await admin
    .from("users")
    .select("id, preferences")
    .eq("id", userId)
    .maybeSingle()

  const baseProfile = {
    id: userId,
    email: TEST_EMAIL,
    name: "First Time Tester",
    user_type: "user",
    preferences: FIRST_TIME_PREFS,
  }

  if (existingRow) {
    await admin
      .from("users")
      .update({
        preferences: { ...(existingRow.preferences || {}), ...FIRST_TIME_PREFS },
      })
      .eq("id", userId)
    console.log("Updated user preferences to first-time state.")
  } else {
    await admin.from("users").insert({
      ...baseProfile,
      created_at: new Date().toISOString(),
    })
    console.log("Inserted user profile with first-time preferences.")
  }

  // Ensure credits exist for testing (optional - user can start interviews)
  const { data: credits } = await admin
    .from("user_credits")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle()

  if (!credits) {
    await admin.from("user_credits").insert({
      user_id: userId,
      balance: 5,
      updated_at: new Date().toISOString(),
    })
    await admin.from("credit_transactions").insert({
      user_id: userId,
      delta: 5,
      reason: "welcome_bonus",
      metadata: { source: "firsttime_test_user" },
    })
    console.log("Granted 5 welcome credits.")
  }

  console.log("\n--- First-time test user ready ---")
  console.log("Email:    " + TEST_EMAIL)
  console.log("Password: " + TEST_PASSWORD)
  console.log("\nLog in at /auth to test onboarding, tour, etc.")
  console.log("To reset and test again: run this script again.")
  console.log("")
  console.log("If interview tour doesn't appear: clear localStorage in DevTools")
  console.log("  (Application → Local Storage → remove keys starting with 'mockzen_interview_tour_seen')")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
