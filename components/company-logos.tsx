"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface CompanyLogoProps {
  companyId: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
}

// Clearbit domains (fallback when local image missing)
const companyDomains: Record<string, string> = {
  google: "google.com",
  amazon: "amazon.com",
  microsoft: "microsoft.com",
  meta: "meta.com",
  apple: "apple.com",
  netflix: "netflix.com",
  tcs: "tcs.com",
  infosys: "infosys.com",
  wipro: "wipro.com",
  flipkart: "flipkart.com",
  swiggy: "swiggy.com",
  zomato: "zomato.com",
  mckinsey: "mckinsey.com",
  bcg: "bcg.com",
  deloitte: "deloitte.com",
  jpmorgan: "jpmorgan.com",
  goldman: "goldmansachs.com",
  openai: "openai.com",
  nvidia: "nvidia.com",
}

const LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg"]

// Custom filenames for user-added logos (paths relative to /company-logos/)
const customLogoPaths: Record<string, string[]> = {
  amazon: ["amazon.png", "imagesamazon.png"],
  apple: ["apple.png", "Apple-Logo.png"],
  bcg: ["BCG_Corporate_Logo.svgWW.png"],
  deloitte: ["imagesdeloitte.png"],
  flipkart: ["flipkart.png"],
  goldman: ["Goldman_Sachs.svgdawdw.png"],
  google: ["google.webp", "google-alt.webp", "Google__G__logo.svg.webp"],
  infosys: ["infosys.png", "infosys-logo.png"],
  jpmorgan: ["imagesjpmorgan.png"],
  mckinsey: ["imagesWWMACKINSEY.png"],
  meta: ["meta.webp", "meta-alt.png", "meta-6871457_1280.webp", "mtalogo.png"],
  microsoft: ["microsoft.png", "microsoft logo.png"],
  netflix: ["netflix.png", "Netflix_icon.svg.png"],
  nvidia: ["imagesnvidia.png"],
  openai: ["opennasD.png"],
  swiggy: ["Untitledswiggy.jpg", "sggseeseg.webp"],
  tcs: ["tcs.jpg"],
  wipro: ["wipro.png", "Wipro_Primary_Logo_Color_RGB.svg.png"],
  zomato: ["Zomato_logoww.png"],
}

function getLogoUrls(companyId: string): string[] {
  const domain = companyDomains[companyId]
  const clearbit = domain ? `https://logo.clearbit.com/${domain}` : ""
  const standard = LOGO_EXTENSIONS.map((ext) => `/company-logos/${companyId}.${ext}`)
  const custom = (customLogoPaths[companyId] || []).map((f) => `/company-logos/${encodeURIComponent(f)}`)
  return [...custom, ...standard, clearbit].filter(Boolean)
}

function FallbackLogo({
  companyId,
  sizeClass,
  className,
}: {
  companyId: string
  sizeClass: string
  className?: string
}) {
  const initials = companyId.slice(0, 2).toUpperCase()
  return (
    <div
      className={cn(sizeClass, "bg-gray-200 rounded-lg flex items-center justify-center shrink-0", className)}
      role="img"
      aria-label={companyId}
    >
      <span className="text-gray-500 text-xs font-bold">{initials}</span>
    </div>
  )
}

export function CompanyLogo({ companyId, className, size = "md" }: CompanyLogoProps) {
  const sizeClass = sizeClasses[size]
  const [sourceIndex, setSourceIndex] = useState(0)
  const [allFailed, setAllFailed] = useState(false)
  const urls = getLogoUrls(companyId)

  if (urls.length === 0 || allFailed) {
    return <FallbackLogo companyId={companyId} sizeClass={sizeClass} className={className} />
  }

  const currentUrl = urls[sourceIndex]
  const hasNext = sourceIndex < urls.length - 1

  return (
    <img
      key={currentUrl}
      src={currentUrl}
      alt={`${companyId} logo`}
      className={cn(sizeClass, "rounded-lg object-contain bg-white shrink-0", className)}
      onError={() => {
        if (hasNext) setSourceIndex((i) => i + 1)
        else setAllFailed(true)
      }}
      loading="lazy"
    />
  )
}

export function getCompanyLogoUrl(companyId: string): string {
  return `/company-logos/${companyId}.png`
}
