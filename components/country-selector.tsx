"use client"

import { useState, useRef, useEffect } from "react"

export const PRICING_COUNTRIES = [
  { value: "india", label: "India" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "canada", label: "Canada" },
  { value: "australia", label: "Australia" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "netherlands", label: "Netherlands" },
  { value: "belgium", label: "Belgium" },
  { value: "switzerland", label: "Switzerland" },
  { value: "austria", label: "Austria" },
  { value: "sweden", label: "Sweden" },
  { value: "norway", label: "Norway" },
  { value: "denmark", label: "Denmark" },
  { value: "finland", label: "Finland" },
  { value: "ireland", label: "Ireland" },
  { value: "portugal", label: "Portugal" },
  { value: "poland", label: "Poland" },
  { value: "singapore", label: "Singapore" },
  { value: "malaysia", label: "Malaysia" },
  { value: "indonesia", label: "Indonesia" },
  { value: "thailand", label: "Thailand" },
  { value: "philippines", label: "Philippines" },
  { value: "vietnam", label: "Vietnam" },
  { value: "hong-kong", label: "Hong Kong" },
  { value: "south-korea", label: "South Korea" },
  { value: "japan", label: "Japan" },
  { value: "china", label: "China" },
  { value: "taiwan", label: "Taiwan" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "saudi-arabia", label: "Saudi Arabia" },
  { value: "israel", label: "Israel" },
  { value: "turkey", label: "Turkey" },
  { value: "south-africa", label: "South Africa" },
  { value: "nigeria", label: "Nigeria" },
  { value: "egypt", label: "Egypt" },
  { value: "kenya", label: "Kenya" },
  { value: "ghana", label: "Ghana" },
  { value: "brazil", label: "Brazil" },
  { value: "mexico", label: "Mexico" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "peru", label: "Peru" },
  { value: "new-zealand", label: "New Zealand" },
  { value: "pakistan", label: "Pakistan" },
  { value: "bangladesh", label: "Bangladesh" },
  { value: "sri-lanka", label: "Sri Lanka" },
  { value: "nepal", label: "Nepal" },
  { value: "russia", label: "Russia" },
  { value: "ukraine", label: "Ukraine" },
  { value: "greece", label: "Greece" },
  { value: "czech-republic", label: "Czech Republic" },
  { value: "romania", label: "Romania" },
  { value: "hungary", label: "Hungary" },
  { value: "other", label: "Other" },
]

interface CountrySelectorProps {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
}

export function CountrySelector({ value, onChange, id = "country-select", className = "" }: CountrySelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedLabel = PRICING_COUNTRIES.find((c) => c.value === value)?.label ?? "Select country"

  const filtered = search.trim()
    ? PRICING_COUNTRIES.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : PRICING_COUNTRIES

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  return (
    <div ref={containerRef} className={`relative w-full max-w-xs ${className}`}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-600">
        Select a country to view pricing
      </label>
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        id={id}
        onClick={() => {
          setOpen(true)
          setSearch("")
        }}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-colors hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      >
        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedLabel}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search country..."
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-gray-400"
          readOnly={!open}
        />
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">No countries found</li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.value}
                role="option"
                aria-selected={value === c.value}
                onClick={() => {
                  onChange(c.value)
                  setSearch("")
                  setOpen(false)
                }}
                className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                  value === c.value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-900 hover:bg-gray-50"
                }`}
              >
                {c.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
