import Link from 'next/link'
import type { ParkWeather } from '@/lib/weather'
import { forecastEmoji, deriveTrailConditions } from '@/lib/weather'
import type { Trailhead, TrailheadScore } from '@/lib/data'

interface TopTrailhead {
  trailhead: Trailhead
  topSpecies: { slug: string; score: number }[]
  totalScore: number
}

function getTopTrailheads(
  trailheads: Trailhead[],
  trailheadScores: TrailheadScore[],
  month: number,
  count = 3,
): TopTrailhead[] {
  const byTrailhead = new Map<string, { slug: string; score: number }[]>()

  for (const ts of trailheadScores) {
    if (ts.month !== month || ts.score <= 0) continue
    if (!byTrailhead.has(ts.trailhead_id)) byTrailhead.set(ts.trailhead_id, [])
    byTrailhead.get(ts.trailhead_id)!.push({ slug: ts.species_slug, score: ts.score })
  }

  return trailheads
    .filter((th) => byTrailhead.has(th.id))
    .map((th) => {
      const species = (byTrailhead.get(th.id) ?? [])
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
      const totalScore = species.reduce((sum, s) => sum + s.score, 0)
      return { trailhead: th, topSpecies: species, totalScore }
    })
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, count)
}

interface Props {
  weather: ParkWeather | null
  trailheads: Trailhead[]
  trailheadScores: TrailheadScore[]
  currentMonth: number
  parkSlug: string
}

export default function ConditionsSection({
  weather,
  trailheads,
  trailheadScores,
  currentMonth,
  parkSlug,
}: Props) {
  const topTrailheads = getTopTrailheads(trailheads, trailheadScores, currentMonth)
  const today = weather?.periods[0] ?? null
  const daytimePeriods = weather?.periods.filter((p) => p.isDaytime).slice(0, 5) ?? []
  const condition = weather ? deriveTrailConditions(weather) : null

  const conditionColors = {
    clear: { dot: 'bg-[#40916C]', text: 'text-[#1B4332]', border: 'border-[#D4C5A9]' },
    caution: { dot: 'bg-amber-400', text: 'text-amber-800', border: 'border-amber-200' },
    warning: { dot: 'bg-red-400', text: 'text-red-800', border: 'border-red-200' },
  }

  return (
    <section className="mb-14">
      <div className="grid md:grid-cols-2 gap-4">

        {/* Weather card */}
        {weather && today && (
          <div className="border border-[#D4C5A9] rounded-xl bg-white overflow-hidden">
            {/* Today banner */}
            <div className="flex items-center gap-4 px-5 py-4 bg-[#F5F1EB] border-b border-[#D4C5A9]">
              <span className="text-3xl">{forecastEmoji(today.shortForecast)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest">{today.name}</p>
                <p className="text-[#1B4332] font-semibold truncate">{today.shortForecast}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-[var(--font-fraunces)] text-[#1B4332]">
                  {today.temperature}°{today.temperatureUnit}
                </p>
                {today.windSpeed && (
                  <p className="text-xs font-mono text-[#52796F]">{today.windSpeed}</p>
                )}
              </div>
            </div>

            {/* 5-day strip */}
            {daytimePeriods.length > 1 && (
              <div className="grid grid-cols-5 divide-x divide-[#D4C5A9] border-b border-[#D4C5A9]">
                {daytimePeriods.map((p) => (
                  <div key={p.name} className="flex flex-col items-center gap-0.5 py-3 px-1">
                    <p className="text-xs font-mono text-[#52796F] text-center leading-tight truncate w-full text-center">
                      {p.name.slice(0, 6)}
                    </p>
                    <span className="text-lg">{forecastEmoji(p.shortForecast)}</span>
                    <p className="text-sm font-semibold text-[#1B4332]">{p.temperature}°</p>
                    {(p.probabilityOfPrecipitation ?? 0) > 0 && (
                      <p className="text-xs font-mono text-[#52796F]">
                        {p.probabilityOfPrecipitation}%
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Trail condition */}
            {condition && (
              <div className={`flex gap-3 items-start px-4 py-3 border-t border-[#D4C5A9] ${
                condition.severity === 'warning' ? 'bg-red-50' :
                condition.severity === 'caution' ? 'bg-amber-50' : ''
              }`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${conditionColors[condition.severity].dot}`} />
                <div>
                  <p className={`text-sm font-semibold ${conditionColors[condition.severity].text}`}>
                    {condition.label}
                  </p>
                  <p className="text-xs text-[#52796F] mt-0.5">{condition.detail}</p>
                </div>
              </div>
            )}

            <p className="px-4 py-2 text-xs text-[#D4C5A9] border-t border-[#D4C5A9]">
              NOAA forecast · updates hourly
            </p>
          </div>
        )}

        {/* Top trailheads card */}
        <div className="border border-[#D4C5A9] rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-4 bg-[#F5F1EB] border-b border-[#D4C5A9]">
            <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest">Best Trailheads Right Now</p>
            <p className="text-sm text-[#52796F] mt-0.5">Top wildlife activity this month</p>
          </div>

          {topTrailheads.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-[#52796F] font-mono">No trailhead data available.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#D4C5A9]">
              {topTrailheads.map(({ trailhead, topSpecies }, i) => (
                <div key={trailhead.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-[#1B4332] text-white text-xs font-mono flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1B4332] truncate">{trailhead.name}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                        {topSpecies.map((s) => (
                          <Link
                            key={s.slug}
                            href={`/parks/${parkSlug}/${s.slug}`}
                            className="text-xs capitalize text-[#52796F] hover:text-[#1B4332] transition-colors"
                          >
                            {s.slug.replace(/-/g, ' ')}
                            <span className="ml-1 font-mono text-[#40916C]">
                              {Math.round(s.score * 100)}%
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-[#D4C5A9] bg-[#F5F1EB]">
            <Link
              href={`/parks/${parkSlug}`}
              className="text-xs font-mono text-[#52796F] hover:text-[#1B4332] transition-colors"
            >
              View full map →
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
