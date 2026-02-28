import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid email' }, { status: 400 })
    }

    const isDev = process.env.NODE_ENV !== 'production'
    const adminSecret = process.env.SUPERADMIN_SECRET_KEY
    const providedSecret = request.headers.get('x-admin-secret')

    // In production require the admin secret header. In development allow local calls.
    if (!isDev) {
      if (!adminSecret || providedSecret !== adminSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
    }

    const admin = await createAdminClient()

    console.error('[v0] /api/supabase-email/dev-resend - requesting resend for', email)
    const { error } = await admin.auth.resend({ type: 'signup', email })

    if (error) {
      // Log full error details (including cause/stack when available) for improved diagnostics in development
      console.error('[v0] /api/supabase-email/dev-resend - resend returned error:', error)
      if ((error as any)?.cause) console.error('[v0] /api/supabase-email/dev-resend - error cause:', (error as any).cause)
      if ((error as any)?.stack) console.error('[v0] /api/supabase-email/dev-resend - error stack:', (error as any).stack)

      // In development include additional context in the JSON response for easier debugging
      const devInfo: any = { message: error.message || String(error) }
      if (process.env.NODE_ENV !== 'production') {
        if ((error as any)?.cause) devInfo.cause = (error as any).cause?.message || String((error as any).cause)
        if ((error as any)?.stack) devInfo.stack = (error as any).stack
      }

      return NextResponse.json({ success: false, error: devInfo.message, ...(process.env.NODE_ENV !== 'production' ? { cause: devInfo.cause, stack: devInfo.stack } : {}) }, { status: 200 })
    }

    return NextResponse.json({ success: true, message: 'Resend request accepted (Supabase attempted to send confirmation). Check provider logs and inbox.' }, { status: 200 })
  } catch (err: any) {
    console.error('[v0] /api/supabase-email/dev-resend unexpected error:', err)
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 })
  }
}
