'use client'

import dynamic from 'next/dynamic'

const TestEmailSender = dynamic(() => import('./test-client'), {
  ssr: false,
})

export default function TestEmailSenderWrapper() {
  return <TestEmailSender />
}
