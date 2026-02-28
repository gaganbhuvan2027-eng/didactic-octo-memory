"use client"

import { useState } from 'react'

export default function TestEmailSender({ defaultEmail }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail || '')
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSend(e: any) {
    e.preventDefault()
    setResult(null)
    setLoading(true)

    try {
      const res = await fetch('/api/supabase-email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret,
        },
        body: JSON.stringify({ email }),
      })

      const json = await res.json()
      if (json.success) {
        setResult('Success: ' + (json.message || 'Resend attempted'))
      } else {
        setResult('Failed: ' + (json.error || 'unknown error'))
      }
    } catch (err: any) {
      setResult('Request error: ' + (err?.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 p-4 rounded border bg-white">
      <h3 className="text-sm font-semibold mb-2">Test resend (admin-only)</h3>
      <form onSubmit={handleSend} className="flex flex-col gap-2">
        <input className="p-2 border rounded" placeholder="Email to test" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="p-2 border rounded" placeholder="Admin secret (x-admin-secret)" value={secret} onChange={(e) => setSecret(e.target.value)} />
        <div className="flex gap-2">
          <button type="submit" className="py-1 px-3 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Testing...' : 'Send test resend'}</button>
          <button type="button" className="py-1 px-3 border rounded" onClick={() => { setEmail(''); setResult(null); setSecret('') }}>Reset</button>
        </div>
        {result && <div className="mt-2 text-sm text-gray-700">{result}</div>}
      </form>
    </div>
  )
}
