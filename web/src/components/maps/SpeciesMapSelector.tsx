'use client'

interface SpeciesOption {
  slug: string
  peakScore: number
}

interface Props {
  species: SpeciesOption[]
  selected: string | null
  onSelect: (slug: string | null) => void
}

export default function SpeciesMapSelector({ species, selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? 'bg-[#1B4332] text-white'
            : 'bg-white border border-[#D4C5A9] text-[#52796F] hover:border-[#40916C]'
        }`}
      >
        All wildlife
      </button>
      {species.map(({ slug, peakScore }) => (
        <button
          key={slug}
          onClick={() => onSelect(selected === slug ? null : slug)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
            selected === slug
              ? 'bg-[#40916C] text-white'
              : 'bg-white border border-[#D4C5A9] text-[#52796F] hover:border-[#40916C]'
          }`}
        >
          {slug.replace(/-/g, ' ')}
          <span className="ml-1.5 font-mono text-xs opacity-70">
            {Math.round(peakScore * 100)}%
          </span>
        </button>
      ))}
    </div>
  )
}
