import TestEmailSenderWrapper from './TestEmailSenderWrapper'

export default function Page() {
  return (
    <div className="prose max-w-none p-6">
      <h1>Supabase Email Setup</h1>

      <div className="mt-6">
        <p className="text-sm text-gray-700">
          If you're still seeing failures, use this admin-only test to trigger a resend.
        </p>
      </div>

      {/* Client component safely loaded here */}
      <div style={{ marginTop: 16 }}>
        <TestEmailSenderWrapper />
      </div>
    </div>
  )
}
