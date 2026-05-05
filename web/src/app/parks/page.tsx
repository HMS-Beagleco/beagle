import type { Metadata } from 'next'
import Link from 'next/link'
import { LAUNCH_PARKS } from '@/lib/parks'

export const metadata: Metadata = {
  title: 'National Parks Wildlife Guide',
  description:
    'Explore wildlife observation data for 10 North American national parks. Find the best times and trails for wildlife encounters.',
}

export default function ParksPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-[var(--font-fraunces)] text-[#1B4332] mb-3">
        National Parks
      </h1>
      <p className="text-[#52796F] mb-12">
        Wildlife intelligence for 10 parks at launch, expanding to 30+ within 6 months.
      </p>
      <div className="grid sm:grid-cols-2 gap-6">
        {LAUNCH_PARKS.map((park) => (
          <Link
            key={park.slug}
            href={`/parks/${park.slug}`}
            className="group block border border-[#D4C5A9] rounded-xl p-6 hover:border-[#40916C] hover:shadow-md transition-all bg-white"
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold text-[#1B4332] group-hover:text-[#40916C] transition-colors">
                {park.name}
              </h2>
              <span className="text-xs font-mono text-[#52796F] bg-[#F5F1EB] px-2 py-1 rounded ml-3 shrink-0">
                {park.state}
              </span>
            </div>
            <p className="text-sm text-[#2D3436] leading-relaxed">{park.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
