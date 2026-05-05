'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import SpeciesMapSelector from './SpeciesMapSelector'
import { MONTH_NAMES, type Month } from '@/types'
import type { Trailhead, TrailheadScore, SpeciesSummary } from '@/lib/data'

const ParkMap = dynamic(() => import('./ParkMap'), { ssr: false })

interface Props {
  trailheads: Trailhead[]
  trailheadScores: TrailheadScore[]
  topSpecies: SpeciesSummary[]
  parkCenter: [number, number]
  parkZoom?: number
  initialMonth: number
}

export default function ParkMapSection({
  trailheads,
  trailheadScores,
  topSpecies,
  parkCenter,
  parkZoom,
  initialMonth,
}: Props) {
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null)
  const [month, setMonth] = useState(initialMonth)

  const months = Object.entries(MONTH_NAMES) as [string, string][]

  const speciesOptions = topSpecies
    .filter((s) =>
      trailheadScores.some(
        (ts) => ts.species_slug === s.slug && ts.month === month
      )
    )
    .slice(0, 12)
    .map((s) => ({ slug: s.slug, peakScore: s.peakScore }))

  if (trailheads.length === 0) {
    return (
      <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
        <p className="text-[#52796F] font-mono text-sm">
          Trailhead data not yet available — run the pipeline to generate it.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-[#52796F] shrink-0">Viewing:</span>
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
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
        <span className="text-[#D4C5A9]">· Larger circle = higher probability</span>
      </div>

      {/* Species selector */}
      <div>
        <p className="text-sm text-[#52796F] mb-3">
          Click a species to highlight its best trailheads:
        </p>
        <SpeciesMapSelector
          species={speciesOptions}
          selected={selectedSpecies}
          onSelect={setSelectedSpecies}
        />
      </div>
    </div>
  )
}
