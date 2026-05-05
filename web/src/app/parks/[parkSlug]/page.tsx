import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LAUNCH_PARKS, getParkBySlug } from '@/lib/parks'
import { MONTH_NAMES } from '@/types'
import { getParkSpecies, getParkAlerts, hasParkData } from '@/lib/data'
import SpeciesCard from '@/components/wildlife/SpeciesCard'

export async function generateStaticParams() {
  return LAUNCH_PARKS.map((park) => ({ parkSlug: park.slug }))
}

export async function generateMetadata(props: PageProps<'/parks/[parkSlug]'>): Promise<Metadata> {
  const { parkSlug } = await props.params
  const park = getParkBySlug(parkSlug)
  if (!park) return {}
  return {
    title: `${park.name} Wildlife Guide`,
    description: park.description,
  }
}

export default async function ParkHubPage(props: PageProps<'/parks/[parkSlug]'>) {
  const { parkSlug } = await props.params
  const park = getParkBySlug(parkSlug)
  if (!park) notFound()

  const hasData = hasParkData(park.slug)
  const allSpecies = hasData ? getParkSpecies(park.slug) : []
  const alerts = hasData ? getParkAlerts(park.slug) : []
  const topSpecies = allSpecies.slice(0, 12)
  const months = Object.entries(MONTH_NAMES) as [string, string][]

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-[#52796F] mb-8">
        <Link href="/parks" className="hover:text-[#1B4332] transition-colors">Parks</Link>
        <span className="mx-2">›</span>
        <span className="text-[#2D3436]">{park.name}</span>
      </nav>

      <h1 className="text-3xl md:text-4xl font-[var(--font-fraunces)] text-[#1B4332] mb-2">
        {park.name}
      </h1>
      <p className="text-[#52796F] font-mono text-sm mb-4">{park.state}</p>
      <p className="text-[#2D3436] leading-relaxed text-lg max-w-2xl mb-10">{park.description}</p>

      {/* NPS Alerts */}
      {alerts.length > 0 && (
        <div className="mb-10 space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
              <span className="text-amber-600 font-medium shrink-0">{alert.category}</span>
              <span className="text-amber-800">{alert.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* Browse by Month */}
      <section className="mb-14">
        <h2 className="text-xl font-[var(--font-fraunces)] text-[#1B4332] mb-4">Browse by Month</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
          {months.map(([num, name]) => (
            <Link
              key={num}
              href={`/parks/${park.slug}/wildlife/${num}`}
              className="block border border-[#D4C5A9] rounded-lg p-2 text-center hover:border-[#40916C] hover:bg-white transition-all group"
            >
              <p className="text-xs font-mono text-[#52796F] group-hover:text-[#40916C] transition-colors">
                {name.slice(0, 3)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Wildlife */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-xl font-[var(--font-fraunces)] text-[#1B4332]">
            Top Wildlife
          </h2>
          {hasData && (
            <p className="text-sm text-[#52796F]">
              {allSpecies.length} species tracked
            </p>
          )}
        </div>

        {!hasData ? (
          <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
            <p className="text-[#52796F] font-mono text-sm">Data pipeline in progress</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topSpecies.map((species) => (
              <SpeciesCard key={species.slug} species={species} parkSlug={park.slug} />
            ))}
          </div>
        )}
      </section>

      {/* Data source callout */}
      {hasData && (
        <div className="mt-12 border border-[#D4C5A9] rounded-xl p-6 bg-white">
          <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest mb-2">Data Sources</p>
          <p className="text-sm text-[#2D3436]">
            Wildlife probability scores are derived from iNaturalist research-grade observations
            and eBird frequency data, aggregated over 5 years with recency weighting.
          </p>
        </div>
      )}
    </div>
  )
}
