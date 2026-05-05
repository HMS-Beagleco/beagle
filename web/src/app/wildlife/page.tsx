import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wildlife Guide — Find Any Species',
  description:
    'Where to see grizzly bears, moose, wolves, bald eagles, and hundreds of other species in North American national parks.',
}

export default function WildlifePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-[var(--font-fraunces)] text-[#1B4332] mb-3">Wildlife</h1>
      <p className="text-[#52796F] mb-12">
        Find any species across all 10 launch parks, sorted by observation frequency.
      </p>

      <div className="border border-[#D4C5A9] rounded-xl p-8 bg-white text-center">
        <p className="text-[#52796F] font-mono text-sm">Species index</p>
        <p className="text-xs text-[#D4C5A9] mt-2">
          Populated from the data pipeline — coming in Phase 1
        </p>
      </div>
    </div>
  )
}
