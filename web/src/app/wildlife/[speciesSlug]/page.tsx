import type { Metadata } from 'next'
import Link from 'next/link'
import { LAUNCH_PARKS } from '@/lib/parks'

export async function generateMetadata(
  props: PageProps<'/wildlife/[speciesSlug]'>
): Promise<Metadata> {
  const { speciesSlug } = await props.params
  const speciesName = speciesSlug.replace(/-/g, ' ')
  return {
    title: `Where to See ${speciesName}`,
    description: `Best national parks and times of year to see ${speciesName}. Seasonal probability scores from real observation data.`,
  }
}

export default async function SpeciesHubPage(props: PageProps<'/wildlife/[speciesSlug]'>) {
  const { speciesSlug } = await props.params
  const speciesName = speciesSlug.replace(/-/g, ' ')

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
      <p className="text-[#52796F] mb-12">
        Observation probability across all parks, by month.
      </p>

      {/* Parks where this species is observed */}
      <section>
        <h2 className="text-lg font-semibold text-[#1B4332] mb-4">Parks with observations</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {LAUNCH_PARKS.map((park) => (
            <Link
              key={park.slug}
              href={`/parks/${park.slug}/${speciesSlug}`}
              className="group block border border-[#D4C5A9] rounded-lg p-4 hover:border-[#40916C] transition-all bg-white"
            >
              <p className="font-medium text-[#1B4332] group-hover:text-[#40916C] transition-colors">
                {park.name}
              </p>
              <p className="text-xs text-[#52796F] mt-1 font-mono">
                Probability data coming soon
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
