import Link from 'next/link'
import ScoreBadge from './ScoreBadge'
import SeasonalityChart from './SeasonalityChart'
import { MONTH_NAMES, type Month } from '@/types'
import type { SpeciesSummary } from '@/lib/data'

interface Props {
  species: SpeciesSummary
  parkSlug: string
  showChart?: boolean
}

export default function SpeciesCard({ species, parkSlug, showChart = true }: Props) {
  const displayName = species.slug.replace(/-/g, ' ')
  const peakMonthName = MONTH_NAMES[species.peakMonth as Month]

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const entry = species.monthlyScores.find((m) => m.month === month)
    return {
      month,
      monthName: MONTH_NAMES[month as Month],
      score: entry?.score ?? 0,
    }
  })

  return (
    <Link
      href={`/parks/${parkSlug}/${species.slug}`}
      className="group block bg-white border border-[#D4C5A9] rounded-xl p-5 hover:border-[#40916C] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-medium text-[#1B4332] capitalize group-hover:text-[#40916C] transition-colors leading-snug">
          {displayName}
        </h3>
        <ScoreBadge score={species.peakScore} />
      </div>
      <p className="text-xs text-[#52796F] mb-4">
        Peak: <span className="font-medium">{peakMonthName}</span>
      </p>
      {showChart && <SeasonalityChart data={chartData} />}
    </Link>
  )
}
