import type { Metadata } from 'next'
import { LAUNCH_PARKS } from '@/lib/parks'
import { getAllSpecies } from '@/lib/data'
import WildlifeSearch from '@/components/wildlife/WildlifeSearch'

export const metadata: Metadata = {
  title: 'Wildlife Guide — Find Any Species',
  description:
    'Where to see grizzly bears, moose, wolves, bald eagles, and hundreds of other species in North American national parks.',
}

function pickFeatured(
  allSpecies: ReturnType<typeof getAllSpecies>,
  count: number
): string[] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  )

  const inSeason = allSpecies.filter((s) => s.currentMonthScore >= 0.3)
  const pool = inSeason.length >= count ? inSeason : allSpecies

  // Pick from different parks for variety, seeded by day-of-year
  const seen = new Set<string>()
  const picked: string[] = []
  for (let i = 0; picked.length < count && i < pool.length * 2; i++) {
    const idx = (dayOfYear * 31 + i * 17) % pool.length
    const s = pool[idx]
    if (!seen.has(s.bestPark)) {
      seen.add(s.bestPark)
      picked.push(s.slug)
    }
  }
  for (const s of pool) {
    if (picked.length >= count) break
    if (!picked.includes(s.slug)) picked.push(s.slug)
  }
  return picked.slice(0, count)
}

export default function WildlifePage() {
  const currentMonth = new Date().getMonth() + 1
  const parkIds = LAUNCH_PARKS.map((p) => p.id)
  const allSpecies = getAllSpecies(currentMonth, parkIds)
  const featuredSlugs = pickFeatured(allSpecies, 3)

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-[var(--font-fraunces)] text-[#1B4332] mb-2">
        Wildlife
      </h1>
      <p className="text-[#52796F] mb-10">
        Search any species across 10 national parks — or browse what&apos;s active right now.
      </p>
      <WildlifeSearch
        allSpecies={allSpecies}
        featuredSlugs={featuredSlugs}
        currentMonth={currentMonth}
      />
    </div>
  )
}
