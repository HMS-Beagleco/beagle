import type { Metadata } from 'next'
import Link from 'next/link'
import { LAUNCH_PARKS } from '@/lib/parks'
import { getSpeciesSeasonality, hasParkData } from '@/lib/data'
import { MONTH_NAMES, type Month } from '@/types'
import ScoreBadge from '@/components/wildlife/ScoreBadge'

export async function generateMetadata(
  props: PageProps<'/wildlife/[speciesSlug]'>
): Promise<Metadata> {
  const { speciesSlug } = await props.params
  const speciesName = speciesSlug.replace(/-/g, ' ')
  return {
    title: `Where to See ${speciesName} in National Parks`,
    description: `Best national parks and months to see ${speciesName}. Seasonal probability scores from real observation data.`,
  }
}

export default async function SpeciesHubPage(props: PageProps<'/wildlife/[speciesSlug]'>) {
  const { speciesSlug } = await props.params
  const speciesName = speciesSlug.replace(/-/g, ' ')
  const currentMonth = new Date().getMonth() + 1

  // For each park that has data, get this species' peak score + best month
  const parkEntries = LAUNCH_PARKS.map((park) => {
    if (!hasParkData(park.id)) return { park, peakScore: 0, peakMonth: null, currentScore: 0 }
    const seasonality = getSpeciesSeasonality(park.id, speciesSlug)
    const best = seasonality.reduce((a, b) => (b.score > a.score ? b : a), seasonality[0])
    const thisMonth = seasonality.find((m) => m.month === currentMonth)
    return {
      park,
      peakScore: best?.score ?? 0,
      peakMonth: best?.score ? best.month : null,
      currentScore: thisMonth?.score ?? 0,
    }
  })

  const parksWithData = parkEntries.filter((e) => e.peakScore > 0)
    .sort((a, b) => b.peakScore - a.peakScore)
  const parksWithout = parkEntries.filter((e) => e.peakScore === 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-[#52796F] mb-8">
        <Link href="/wildlife" className="hover:text-[#1B4332] transition-colors">Wildlife</Link>
        <span className="mx-2">›</span>
        <span className="text-[#2D3436] capitalize">{speciesName}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-[var(--font-fraunces)] text-[#1B4332] mb-3 capitalize">
        Where to See {speciesName}
      </h1>
      <p className="text-[#52796F] mb-10">
        Observation probability by park and month, from verified wildlife sightings.
      </p>

      {parksWithData.length === 0 ? (
        <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
          <p className="text-[#52796F] font-mono text-sm">No observation data found for this species.</p>
        </div>
      ) : (
        <section className="mb-12">
          <h2 className="text-lg font-[var(--font-fraunces)] text-[#1B4332] mb-4">Parks with observations</h2>
          <div className="space-y-3">
            {parksWithData.map(({ park, peakScore, peakMonth, currentScore }) => (
              <Link
                key={park.slug}
                href={`/parks/${park.slug}/${speciesSlug}`}
                className="group flex items-center justify-between bg-white border border-[#D4C5A9] rounded-xl px-5 py-4 hover:border-[#40916C] hover:shadow-sm transition-all"
              >
                <div>
                  <p className="font-medium text-[#1B4332] group-hover:text-[#40916C] transition-colors">
                    {park.name}
                  </p>
                  <p className="text-xs text-[#52796F] mt-0.5 font-mono">
                    {park.state}
                    {peakMonth && (
                      <> · Peak in {MONTH_NAMES[peakMonth as Month]}</>
                    )}
                    {currentScore > 0 && (
                      <> · Active now</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {currentScore > 0 && (
                    <span className="text-xs font-mono text-[#40916C]">
                      {Math.round(currentScore * 100)}% this month
                    </span>
                  )}
                  <ScoreBadge score={peakScore} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {parksWithout.length > 0 && parksWithData.length > 0 && (
        <section>
          <h2 className="text-sm font-mono text-[#B0A898] uppercase tracking-widest mb-3">No data yet</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {parksWithout.map(({ park }) => (
              <div key={park.slug} className="border border-[#F0EBE0] rounded-lg px-4 py-3 bg-[#FAFAF8]">
                <p className="text-sm text-[#B0A898]">{park.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
