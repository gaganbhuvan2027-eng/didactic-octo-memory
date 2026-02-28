"use client"

import { Navbar } from "@/components/navbar"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-4 animate-fade-in">Privacy Policy</h1>
        <p className="text-gray-600 mb-12 animate-fade-in" style={{ animationDelay: "100ms" }}>
          Last updated: January 2025
        </p>

        <div className="space-y-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              MockZen ("we", "us", "our", or "Company") operates the MockZen website and application. This page
              informs you of our policies regarding the collection, use, and disclosure of personal data when you use
              our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information Collection and Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect several different types of information for various purposes to provide and improve our Service
              to you.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Personal Data: Name, email address, phone number, profile information</li>
              <li>Usage Data: Browser type, IP address, pages visited, time and date of visits</li>
              <li>Interview Data: Audio/video recordings, transcripts, performance metrics</li>
              <li>Cookies and Tracking: We use cookies to track activity on our Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Use of Data</h2>
            <p className="text-gray-700 leading-relaxed">
              MockZen uses the collected data for various purposes including: providing and maintaining our Service,
              notifying you about changes, allowing you to participate in interactive features, providing customer
              support, gathering analysis or valuable information, monitoring the usage of our Service, and detecting,
              preventing and addressing technical issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Security of Data</h2>
            <p className="text-gray-700 leading-relaxed">
              The security of your data is important to us but remember that no method of transmission over the Internet
              or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to
              protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
              Privacy Policy on this page and updating the "Last updated" date at the top of this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@mockzen.com
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
