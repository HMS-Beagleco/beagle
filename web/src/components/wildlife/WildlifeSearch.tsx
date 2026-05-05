'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { CrossParkSpecies } from '@/lib/data'
import { MONTH_NAMES, type Month } from '@/types'

interface Props {
  allSpecies: CrossParkSpecies[]
  featuredSlugs: string[]
  currentMonth: number
}

export default function WildlifeSearch({ allSpecies, featuredSlugs, currentMonth }: Props) {
  const [query, setQuery] = useState('')

  const featured = useMemo(
    () => featuredSlugs.map((s) => allSpecies.find((sp) => sp.slug === s)).filter(Boolean) as CrossParkSpecies[],
    [allSpecies, featuredSlugs]
  )

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allSpecies.filter((s) => s.name.includes(q)).slice(0, 30)
  }, [query, allSpecies])

  const isSearching = query.trim().length > 0

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any species — grizzly bear, bald eagle, moose…"
          className="w-full border border-[#D4C5A9] rounded-xl px-5 py-4 text-[#2D3436] placeholder-[#B0A898] focus:outline-none focus:border-[#40916C] focus:ring-1 focus:ring-[#40916C] bg-white text-base"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A898] hover:text-[#52796F] text-xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      {/* Search results */}
      {isSearching ? (
        results.length === 0 ? (
          <p className="text-[#52796F] text-sm">No species found for &ldquo;{query}&rdquo;.</p>
        ) : (
          <div className="space-y-2">
            {results.map((s) => (
              <SpeciesRow key={s.slug} species={s} currentMonth={currentMonth} />
            ))}
          </div>
        )
      ) : (
        <>
          {/* Featured species */}
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-[var(--font-fraunces)] text-[#1B4332]">
              In Season — {MONTH_NAMES[currentMonth as Month]}
            </h2>
            <span className="text-xs font-mono text-[#52796F]">{allSpecies.length} species tracked</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            {featured.map((s) => (
              <FeaturedCard key={s.slug} species={s} currentMonth={currentMonth} />
            ))}
          </div>

          {/* Top species list */}
          <h2 className="text-lg font-[var(--font-fraunces)] text-[#1B4332] mb-4">Top Wildlife Across All Parks</h2>
          <div className="space-y-2">
            {allSpecies.slice(0, 50).map((s) => (
              <SpeciesRow key={s.slug} species={s} currentMonth={currentMonth} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function FeaturedCard({ species: s, currentMonth }: { species: CrossParkSpecies; currentMonth: number }) {
  const score = s.currentMonthScore > 0 ? s.currentMonthScore : s.peakScore
  const scoreLabel = s.currentMonthScore > 0
    ? `${Math.round(s.currentMonthScore * 100)}% likely this month`
    : `Peak ${Math.round(s.peakScore * 100)}% in ${MONTH_NAMES[s.peakMonth as Month]}`

  return (
    <Link
      href={`/wildlife/${s.slug}`}
      className="group block bg-white border border-[#D4C5A9] rounded-xl p-5 hover:border-[#40916C] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-[#1B4332] capitalize group-hover:text-[#40916C] transition-colors leading-tight">
          {s.name}
        </h3>
        <span
          className="shrink-0 ml-2 text-sm font-mono font-semibold"
          style={{ color: scoreColor(score) }}
        >
          {Math.round(score * 100)}%
        </span>
      </div>
      <p className="text-xs text-[#52796F] font-mono">{scoreLabel}</p>
      <p className="text-xs text-[#B0A898] mt-1">{s.parkCount} park{s.parkCount !== 1 ? 's' : ''}</p>
    </Link>
  )
}

function SpeciesRow({ species: s, currentMonth }: { species: CrossParkSpecies; currentMonth: number }) {
  const score = s.currentMonthScore > 0 ? s.currentMonthScore : s.peakScore
  const monthLabel = s.currentMonthScore > 0
    ? MONTH_NAMES[currentMonth as Month]
    : `Peak ${MONTH_NAMES[s.peakMonth as Month]}`

  return (
    <Link
      href={`/wildlife/${s.slug}`}
      className="group flex items-center justify-between bg-white border border-[#D4C5A9] rounded-xl px-5 py-3.5 hover:border-[#40916C] hover:shadow-sm transition-all"
    >
      <div>
        <span className="font-medium text-[#1B4332] capitalize group-hover:text-[#40916C] transition-colors">
          {s.name}
        </span>
        <span className="ml-3 text-xs text-[#B0A898] font-mono">{s.parkCount} park{s.parkCount !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-mono text-[#52796F]">{monthLabel}</span>
        <span
          className="text-sm font-mono font-semibold w-10 text-right"
          style={{ color: scoreColor(score) }}
        >
          {Math.round(score * 100)}%
        </span>
      </div>
    </Link>
  )
}

function scoreColor(score: number) {
  if (score >= 0.75) return '#40916C'
  if (score >= 0.5) return '#52796F'
  if (score >= 0.25) return '#B8860B'
  return '#b0b0b0'
}
