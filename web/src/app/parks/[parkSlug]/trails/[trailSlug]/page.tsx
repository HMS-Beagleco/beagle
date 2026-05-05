import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getParkBySlug } from '@/lib/parks'

export async function generateMetadata(
  props: PageProps<'/parks/[parkSlug]/trails/[trailSlug]'>
): Promise<Metadata> {
  const { parkSlug, trailSlug } = await props.params
  const park = getParkBySlug(parkSlug)
  if (!park) return {}
  const trailName = trailSlug.replace(/-/g, ' ')
  return {
    title: `${trailName} Trail Conditions — ${park.name}`,
    description: `Current trail conditions, recent wildlife sightings, and access status for ${trailName} in ${park.name}.`,
  }
}

export default async function TrailReportPage(
  props: PageProps<'/parks/[parkSlug]/trails/[trailSlug]'>
) {
  const { parkSlug, trailSlug } = await props.params
  const park = getParkBySlug(parkSlug)
  if (!park) notFound()

  const trailName = trailSlug.replace(/-/g, ' ')

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <nav className="text-sm text-[#52796F] mb-8">
        <Link href="/parks" className="hover:text-[#1B4332] transition-colors">Parks</Link>
        <span className="mx-2">›</span>
        <Link href={`/parks/${park.slug}`} className="hover:text-[#1B4332] transition-colors">
          {park.name}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-[#2D3436] capitalize">{trailName}</span>
      </nav>

      <h1 className="text-3xl font-[var(--font-fraunces)] text-[#1B4332] mb-3 capitalize">
        {trailName}
      </h1>
      <p className="text-[#52796F] mb-12">{park.name} · Trail Conditions &amp; Recent Sightings</p>

      <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
        <p className="text-[#52796F] font-mono text-sm capitalize">
          Trail report: {trailName}
        </p>
        <p className="text-xs text-[#D4C5A9] mt-2">
          NPS trail data integration in progress
        </p>
      </div>
    </div>
  )
}
