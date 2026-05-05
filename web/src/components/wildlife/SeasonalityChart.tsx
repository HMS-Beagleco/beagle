interface MonthScore {
  month: number
  monthName: string
  score: number
}

export default function SeasonalityChart({ data }: { data: MonthScore[] }) {
  const max = Math.max(...data.map((d) => d.score), 0.01)

  return (
    <div className="w-full">
      <div className="flex items-end gap-1 h-20">
        {data.map(({ month, monthName, score }) => {
          const heightPct = (score / max) * 100
          const isStrong = score >= 0.5
          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end" style={{ height: '64px' }}>
                <div
                  className={`w-full rounded-t transition-all ${
                    isStrong ? 'bg-[#40916C]' : 'bg-[#D4C5A9]'
                  } group-hover:opacity-80`}
                  style={{ height: `${Math.max(heightPct, 3)}%` }}
                  title={`${monthName}: ${Math.round(score * 100)}%`}
                />
              </div>
              <span className="text-[9px] font-mono text-[#52796F]">
                {monthName.slice(0, 1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
