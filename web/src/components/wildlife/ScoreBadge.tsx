export default function ScoreBadge({ score }: { score: number }) {
  const label =
    score >= 0.75 ? 'Very Likely' : score >= 0.5 ? 'Likely' : score >= 0.25 ? 'Possible' : 'Rare'

  const colors =
    score >= 0.75
      ? 'bg-green-100 text-green-800'
      : score >= 0.5
        ? 'bg-lime-100 text-lime-800'
        : score >= 0.25
          ? 'bg-amber-100 text-amber-800'
          : 'bg-slate-100 text-slate-500'

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors}`}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: 'currentColor', opacity: 0.7 }}
      />
      {label} · {Math.round(score * 100)}%
    </span>
  )
}
