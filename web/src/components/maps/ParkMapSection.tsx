'use client'

import dynamic from 'next/dynamic'
import { useState, useRef, useEffect } from 'react'
import { MONTH_NAMES, type Month } from '@/types'
import type { Trailhead, TrailheadScore, SpeciesSummary } from '@/lib/data'

const ParkMap = dynamic(() => import('./ParkMap'), { ssr: false })

interface Props {
  trailheads: Trailhead[]
  trailheadScores: TrailheadScore[]
  topSpecies: SpeciesSummary[]
  spotlightSlugs: string[]        // charismatic species with data in this park
  parkCenter: [number, number]
  parkZoom?: number
  initialMonth: number
  initialSpecies?: string | null  // pre-select a species (e.g. coming from species page)
}

export default function ParkMapSection({
  trailheads,
  trailheadScores,
  topSpecies,
  spotlightSlugs,
  parkCenter,
  parkZoom,
  initialMonth,
  initialSpecies = null,
}: Props) {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(initialSpecies)
  const [month, setMonth] = useState(initialMonth)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const months = Object.entries(MONTH_NAMES) as [string, string][]

  // All species with trailhead data for the current month
  const speciesWithData = topSpecies
    .filter((s) => trailheadScores.some((ts) => ts.species_slug === s.slug && ts.month === month))
    .map((s) => s.slug)

  const spotlightWithData = spotlightSlugs.filter((s) => speciesWithData.includes(s))
  const otherSpecies = topSpecies
    .filter((s) => speciesWithData.includes(s.slug) && !spotlightSlugs.includes(s.slug))

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const handleSelect = (slug: string | null) => {
    setSelectedSpecies((prev) => (prev === slug ? null : slug))
    setDropdownOpen(false)
  }

  if (trailheads.length === 0) {
    return (
      <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
        <p className="text-[#52796F] font-mono text-sm">
          Trailhead data not yet available.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#52796F] shrink-0">Month:</span>
        <div className="flex gap-1 flex-wrap">
          {months.map(([num, name]) => (
            <button
              key={num}
              onClick={() => setMonth(Number(num))}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                month === Number(num)
                  ? 'bg-[#1B4332] text-white'
                  : 'bg-white border border-[#D4C5A9] text-[#52796F] hover:border-[#40916C]'
              }`}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-[#D4C5A9]">
        <ParkMap
          trailheads={trailheads}
          scores={trailheadScores}
          selectedSpecies={selectedSpecies}
          month={month}
          parkCenter={parkCenter}
          parkZoom={parkZoom}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-[#52796F]">
        {[
          { color: '#40916C', label: 'Very likely (75%+)' },
          { color: '#52796F', label: 'Likely (50–75%)' },
          { color: '#D4C5A9', label: 'Possible (25–50%)' },
          { color: '#b0b0b0', label: 'Rare (<25%)' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
        <span className="text-[#D4C5A9]">· Larger = higher probability</span>
      </div>

      {/* Species toggles */}
      <div>
        <p className="text-sm text-[#52796F] mb-3">Filter by species:</p>
        <div className="flex flex-wrap gap-2 items-center">
          {/* All wildlife reset */}
          <button
            onClick={() => handleSelect(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedSpecies === null
                ? 'bg-[#1B4332] text-white'
                : 'bg-white border border-[#D4C5A9] text-[#52796F] hover:border-[#40916C]'
            }`}
          >
            All wildlife
          </button>

          {/* Spotlight species */}
          {spotlightWithData.map((slug) => {
            const s = topSpecies.find((sp) => sp.slug === slug)
            const score = trailheadScores
              .filter((ts) => ts.species_slug === slug && ts.month === month)
              .reduce((max, ts) => Math.max(max, ts.score), 0)
            return (
              <button
                key={slug}
                onClick={() => handleSelect(slug)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  selectedSpecies === slug
                    ? 'bg-[#40916C] text-white'
                    : 'bg-[#F5F1EB] border border-[#C8B99A] text-[#1B4332] hover:border-[#40916C] hover:bg-white'
                }`}
              >
                {slug.replace(/-/g, ' ')}
                {score > 0 && (
                  <span className="ml-1.5 text-xs opacity-70 font-mono">
                    {Math.round(score * 100)}%
                  </span>
                )}
              </button>
            )
          })}

          {/* More species dropdown */}
          {otherSpecies.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  dropdownOpen || (selectedSpecies && !spotlightWithData.includes(selectedSpecies))
                    ? 'bg-[#1B4332] text-white border-[#1B4332]'
                    : 'bg-white border-[#D4C5A9] text-[#52796F] hover:border-[#40916C]'
                }`}
              >
                {selectedSpecies && !spotlightWithData.includes(selectedSpecies) && selectedSpecies !== null
                  ? selectedSpecies.replace(/-/g, ' ')
                  : 'More species'}
                <span className="ml-1">{dropdownOpen ? '▲' : '▼'}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#D4C5A9] rounded-xl shadow-lg w-56 max-h-64 overflow-y-auto">
                  {otherSpecies.map((s) => {
                    const score = trailheadScores
                      .filter((ts) => ts.species_slug === s.slug && ts.month === month)
                      .reduce((max, ts) => Math.max(max, ts.score), 0)
                    return (
                      <button
                        key={s.slug}
                        onClick={() => handleSelect(s.slug)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[#F5F1EB] transition-colors capitalize ${
                          selectedSpecies === s.slug ? 'text-[#40916C] font-medium' : 'text-[#2D3436]'
                        }`}
                      >
                        <span>{s.slug.replace(/-/g, ' ')}</span>
                        {score > 0 && (
                          <span className="font-mono text-xs text-[#52796F] ml-2">
                            {Math.round(score * 100)}%
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
