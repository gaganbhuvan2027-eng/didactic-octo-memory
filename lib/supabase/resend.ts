export async function resendConfirmation({ supabase, email, redirectUrl }: { supabase: any; email: string; redirectUrl?: string }) {
  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectUrl } })
    if (error) {
      const errMsg = (error?.message || String(error || '')).toString()
      if (/invalid/i.test(errMsg)) {
        return { success: false, message: `Failed to resend: ${errMsg}. Please verify the email address and try again.` }
      } else if (/smtp|provider|delivery|send/i.test(errMsg)) {
        return { success: false, message: `Failed to resend confirmation email: ${errMsg}. Check your email provider settings (see /help/supabase-email) or try again later.` }
      } else {
        return { success: false, message: `Failed to resend confirmation email. ${errMsg}` }
      }
    }

    return { success: true, message: 'Confirmation email resent. Please check your inbox and spam folder.' }
  } catch (err: any) {
    console.error('[v0] resendConfirmation unexpected error:', err)
    return { success: false, message: 'Failed to resend confirmation email. Please try again later.' }
  }
}
