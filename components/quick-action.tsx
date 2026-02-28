"use client"

import React from 'react'
import { useRouter } from 'next/navigation'

export default function QuickAction({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter()
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => { if ((e as any).key === 'Enter') router.push(href) }}
      className={className}
    >
      {children}
    </div>
  )
}
