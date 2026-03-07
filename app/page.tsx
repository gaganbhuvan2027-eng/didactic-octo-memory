import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/home/hero-section"
import InterviewSelector from "@/components/home/interview-selector"
import TrustedBy from "@/components/home/trusted-by"
import KeyBenefits from "@/components/home/key-benefits"
import HowItWorks from "@/components/home/how-it-works"
import CTASection from "@/components/home/cta-section"
import Footer from "@/components/footer"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string; error_code?: string }>
}) {
  const params = await searchParams
  const error = params?.error
  const errorDescription = params?.error_description
  if (error) {
    const msg = errorDescription || error
    redirect(`/auth?error=${encodeURIComponent(msg)}`)
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <InterviewSelector />
      <TrustedBy />
      <KeyBenefits />
      <HowItWorks />
      <CTASection />
      <Footer />
    </main>
  )
}
