import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LAUNCH_PARKS, getParkBySlug } from '@/lib/parks'
import { MONTH_NAMES, type Month } from '@/types'
import { getParkSpeciesForMonth, hasParkData } from '@/lib/data'
import ScoreBadge from '@/components/wildlife/ScoreBadge'

export async function generateStaticParams() {
  return LAUNCH_PARKS.flatMap((park) =>
    Object.keys(MONTH_NAMES).map((month) => ({ parkSlug: park.slug, month }))
  )
}

export async function generateMetadata(
  props: PageProps<'/parks/[parkSlug]/wildlife/[month]'>
): Promise<Metadata> {
  const { parkSlug, month } = await props.params
  const park = getParkBySlug(parkSlug)
  const monthName = MONTH_NAMES[Number(month) as Month]
  if (!park || !monthName) return {}
  return {
    title: `${park.name} Wildlife in ${monthName}`,
    description: `What wildlife can you see at ${park.name} in ${monthName}? Observation data and probability scores for mammals, birds, reptiles, and amphibians.`,
  }
}

export default async function SeasonalGuidePage(
  props: PageProps<'/parks/[parkSlug]/wildlife/[month]'>
) {
  const { parkSlug, month } = await props.params
  const park = getParkBySlug(parkSlug)
  const monthNum = Number(month)
  const monthName = MONTH_NAMES[monthNum as Month]
  if (!park || !monthName) notFound()

  const hasData = hasParkData(park.slug)
  const species = hasData ? getParkSpeciesForMonth(park.slug, monthNum) : []

  const prevMonth = monthNum === 1 ? 12 : monthNum - 1
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-[#52796F] mb-8">
        <Link href="/parks" className="hover:text-[#1B4332] transition-colors">Parks</Link>
        <span className="mx-2">›</span>
        <Link href={`/parks/${park.slug}`} className="hover:text-[#1B4332] transition-colors">{park.name}</Link>
        <span className="mx-2">›</span>
        <span className="text-[#2D3436]">{monthName}</span>
      </nav>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-[var(--font-fraunces)] text-[#1B4332] mb-2">
            {park.name} in {monthName}
          </h1>
          <p className="text-[#52796F]">
            {hasData
              ? `${species.length} species with observation data`
              : 'Data pipeline in progress'}
          </p>
        </div>
        {/* Month navigation */}
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/parks/${park.slug}/wildlife/${prevMonth}`}
            className="px-3 py-1.5 border border-[#D4C5A9] rounded-lg text-sm text-[#52796F] hover:border-[#40916C] transition-colors"
          >
            ← {MONTH_NAMES[prevMonth as Month].slice(0, 3)}
          </Link>
          <Link
            href={`/parks/${park.slug}/wildlife/${nextMonth}`}
            className="px-3 py-1.5 border border-[#D4C5A9] rounded-lg text-sm text-[#52796F] hover:border-[#40916C] transition-colors"
          >
            {MONTH_NAMES[nextMonth as Month].slice(0, 3)} →
          </Link>
        </div>
      </div>

      {!hasData ? (
        <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
          <p className="text-[#52796F] font-mono text-sm">Data pipeline in progress</p>
        </div>
      ) : species.length === 0 ? (
        <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
          <p className="text-[#52796F]">No observation data for this month.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {species.map((row) => (
            <Link
              key={row.species_slug}
              href={`/parks/${park.slug}/${row.species_slug}`}
              className="group flex items-center justify-between bg-white border border-[#D4C5A9] rounded-xl px-5 py-4 hover:border-[#40916C] hover:shadow-sm transition-all"
            >
              <span className="font-medium text-[#1B4332] capitalize group-hover:text-[#40916C] transition-colors">
                {row.species_slug.replace(/-/g, ' ')}
              </span>
              <ScoreBadge score={row.score} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
