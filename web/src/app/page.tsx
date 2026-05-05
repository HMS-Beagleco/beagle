import Link from 'next/link'
import { LAUNCH_PARKS } from '@/lib/parks'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-[#1B4332] text-[#F5F1EB] px-6 py-24 md:py-36">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#40916C] text-sm font-mono uppercase tracking-widest mb-4">
            Wildlife Trail Intelligence
          </p>
          <h1
            className="text-4xl md:text-6xl font-[var(--font-fraunces)] font-semibold leading-tight mb-6"
          >
            Know when — and where —<br />to find the wildlife you came for.
          </h1>
          <p className="text-[#D4C5A9] text-lg md:text-xl max-w-2xl leading-relaxed mb-10">
            Beagle turns millions of real wildlife observations into seasonal trip intelligence for
            North America&apos;s best national parks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/parks"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#40916C] text-white rounded-lg font-medium hover:bg-[#52796F] transition-colors"
            >
              Explore Parks
            </Link>
            <Link
              href="/wildlife"
              className="inline-flex items-center justify-center px-6 py-3 border border-[#52796F] text-[#D4C5A9] rounded-lg font-medium hover:bg-[#52796F]/20 transition-colors"
            >
              Find Wildlife
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-[#F5F1EB]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-[var(--font-fraunces)] text-[#1B4332] mb-12">
            Built on real observation data
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                label: 'iNaturalist',
                description: 'Research-grade species observations with GPS coordinates and photo evidence.',
              },
              {
                label: 'eBird',
                description: 'Bird frequency data by location and week of year from Cornell Lab.',
              },
              {
                label: 'NPS Reports',
                description: 'Official trail conditions, closures, and seasonal access information.',
              },
            ].map((source) => (
              <div key={source.label} className="border border-[#D4C5A9] rounded-lg p-6">
                <p className="font-mono text-xs text-[#52796F] uppercase tracking-wider mb-2">
                  {source.label}
                </p>
                <p className="text-[#2D3436] leading-relaxed">{source.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Launch Parks */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-[var(--font-fraunces)] text-[#1B4332] mb-2">
            10 parks at launch
          </h2>
          <p className="text-[#52796F] mb-10">
            Selected for wildlife diversity, data density, and search volume.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {LAUNCH_PARKS.map((park) => (
              <Link
                key={park.slug}
                href={`/parks/${park.slug}`}
                className="group block border border-[#D4C5A9] rounded-lg p-5 hover:border-[#40916C] hover:shadow-sm transition-all"
              >
                <p className="font-medium text-[#1B4332] group-hover:text-[#40916C] transition-colors">
                  {park.name}
                </p>
                <p className="text-sm text-[#52796F] mt-1">{park.state}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
