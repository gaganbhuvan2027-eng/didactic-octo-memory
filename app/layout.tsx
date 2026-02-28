import type React from "react"
import type { Metadata } from "next"
import { Inter, Sora } from 'next/font/google'
import "./globals.css"

const _sora = Sora({ subsets: ["latin"], variable: "--font-sora" })
const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "MockZen - AI Mock Interview Platform",
  description: "Practice interviews with AI. Get instant feedback and improve your interview skills with MockZen.",
  generator: "MockZen",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${_sora.variable} ${_inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
