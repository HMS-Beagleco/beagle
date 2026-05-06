import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getParkBySlug } from '@/lib/parks'
import { getSpeciesSeasonality, hasParkData, getParkSpecies, getParkTrailheads, getTrailheadScores, getParkCenter } from '@/lib/data'
import SeasonalityChart from '@/components/wildlife/SeasonalityChart'
import ScoreBadge from '@/components/wildlife/ScoreBadge'
import ParkMapSection from '@/components/maps/ParkMapSection'
import { getSpotlightForPark } from '@/lib/spotlight'

export async function generateMetadata(
  props: PageProps<'/parks/[parkSlug]/[speciesSlug]'>
): Promise<Metadata> {
  const { parkSlug, speciesSlug } = await props.params
  const park = getParkBySlug(parkSlug)
  if (!park) return {}
  const speciesName = speciesSlug.replace(/-/g, ' ')
  return {
    title: `${speciesName} at ${park.name}`,
    description: `When and where to see ${speciesName} at ${park.name}. Seasonal probability scores from real observation data.`,
  }
}

export default async function SpeciesParkPage(
  props: PageProps<'/parks/[parkSlug]/[speciesSlug]'>
) {
  const { parkSlug, speciesSlug } = await props.params
  const park = getParkBySlug(parkSlug)
  if (!park) notFound()

  const speciesName = speciesSlug.replace(/-/g, ' ')
  const hasData = hasParkData(park.slug)
  const seasonality = hasData ? getSpeciesSeasonality(park.slug, speciesSlug) : []
  const peakEntry = seasonality.reduce(
    (best, m) => (m.score > (best?.score ?? 0) ? m : best),
    seasonality[0]
  )
  const hasSpeciesData = seasonality.some((m) => m.score > 0)
  const currentMonth = new Date().getMonth() + 1

  // Map data
  const trailheads = hasData ? getParkTrailheads(park.slug) : []
  const trailheadScores = hasData ? getTrailheadScores(park.slug) : []
  const parkCenter = hasData ? getParkCenter(park.slug) : [(park.bounding_box.north + park.bounding_box.south) / 2, (park.bounding_box.east + park.bounding_box.west) / 2] as [number, number]
  const allSpecies = hasData ? getParkSpecies(park.slug) : []
  const spotlightSlugs = getSpotlightForPark(allSpecies.map((s) => s.slug))
  // Check if this species has any trailhead data
  const hasTrailheadData = trailheadScores.some((ts) => ts.species_slug === speciesSlug)

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-[#52796F] mb-8">
        <Link href="/parks" className="hover:text-[#1B4332] transition-colors">Parks</Link>
        <span className="mx-2">›</span>
        <Link href={`/parks/${park.slug}`} className="hover:text-[#1B4332] transition-colors">{park.name}</Link>
        <span className="mx-2">›</span>
        <span className="text-[#2D3436] capitalize">{speciesName}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-[var(--font-fraunces)] text-[#1B4332] mb-2 capitalize">
        {speciesName}
      </h1>
      <p className="text-[#52796F] mb-10">{park.name}</p>

      {!hasData || !hasSpeciesData ? (
        <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
          <p className="text-[#52796F] font-mono text-sm">No observation data available yet.</p>
        </div>
      ) : (
        <>
          {/* Peak info */}
          <div className="flex flex-wrap gap-4 mb-10">
            <div className="border border-[#D4C5A9] rounded-xl p-5 bg-white flex-1 min-w-40">
              <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest mb-1">Best Month</p>
              <p className="text-2xl font-[var(--font-fraunces)] text-[#1B4332]">{peakEntry?.monthName}</p>
            </div>
            <div className="border border-[#D4C5A9] rounded-xl p-5 bg-white flex-1 min-w-40">
              <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest mb-2">Peak Likelihood</p>
              {peakEntry && <ScoreBadge score={peakEntry.score} />}
            </div>
          </div>

          {/* Trailhead map — pre-filtered to this species */}
          {hasTrailheadData && trailheads.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-[var(--font-fraunces)] text-[#1B4332] mb-4">
                Best Trailheads for {speciesName}
              </h2>
              <ParkMapSection
                trailheads={trailheads}
                trailheadScores={trailheadScores}
                topSpecies={allSpecies.slice(0, 20)}
                spotlightSlugs={spotlightSlugs}
                parkCenter={parkCenter}
                parkZoom={10}
                initialMonth={peakEntry?.month ?? currentMonth}
                initialSpecies={speciesSlug}
              />
            </section>
          )}

          {/* Seasonality chart */}
          <div className="border border-[#D4C5A9] rounded-xl p-6 bg-white mb-8">
            <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest mb-4">
              Observation Probability by Month
            </p>
            <SeasonalityChart data={seasonality} />
          </div>

          {/* Monthly breakdown table */}
          <div className="border border-[#D4C5A9] rounded-xl overflow-hidden bg-white">
            <div className="grid grid-cols-2 border-b border-[#D4C5A9] px-5 py-2 bg-[#F5F1EB]">
              <span className="text-xs font-mono text-[#52796F] uppercase tracking-widest">Month</span>
              <span className="text-xs font-mono text-[#52796F] uppercase tracking-widest">Likelihood</span>
            </div>
            {seasonality.map(({ month, monthName, score }) => (
              <Link
                key={month}
                href={`/parks/${park.slug}/wildlife/${month}`}
                className="grid grid-cols-2 items-center px-5 py-3 border-b border-[#D4C5A9] last:border-0 hover:bg-[#F5F1EB] transition-colors"
              >
                <span className="text-sm text-[#2D3436]">{monthName}</span>
                {score > 0 ? (
                  <ScoreBadge score={score} />
                ) : (
                  <span className="text-xs text-[#D4C5A9]">No data</span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
