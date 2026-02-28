import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const adminSecret = process.env.SUPERADMIN_SECRET_KEY
  const providedSecret = request.headers.get('x-admin-secret')

  if (!adminSecret || adminSecret === 'your-secret-key-here') {
    return NextResponse.json({ success: false, error: 'Admin secret not configured on server. Set SUPERADMIN_SECRET_KEY in .env.' }, { status: 403 })
  }

  if (!providedSecret || providedSecret !== adminSecret) {
    return NextResponse.json({ success: false, error: 'Invalid admin secret header' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing or invalid email' }, { status: 400 })
    }

    const admin = await createAdminClient()
    const { error } = await admin.auth.resend({ type: 'signup', email })

    if (error) {
      return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 200 })
    }

    return NextResponse.json({ success: true, message: 'Resend request accepted (Supabase attempted to send confirmation). Check provider logs and inbox.' }, { status: 200 })
  } catch (err: any) {
    console.error('[v0] /api/supabase-email/test error:', err)
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 })
  }
}
