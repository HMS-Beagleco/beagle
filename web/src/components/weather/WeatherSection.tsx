import type { ParkWeather, TrailConditionEstimate } from '@/lib/weather'
import { forecastEmoji, deriveTrailConditions } from '@/lib/weather'

interface Props {
  weather: ParkWeather
  parkName: string
}

export default function WeatherSection({ weather, parkName }: Props) {
  const conditions = deriveTrailConditions(weather)
  // Show daytime periods only for the 5-day strip, fall back to all if none
  const daytimePeriods = weather.periods.filter((p) => p.isDaytime).slice(0, 5)
  const today = weather.periods[0]

  return (
    <section className="mb-14">
      <h2 className="text-xl font-[var(--font-fraunces)] text-[#1B4332] mb-4">
        Current Conditions
      </h2>

      <div className="border border-[#D4C5A9] rounded-xl bg-white overflow-hidden">
        {/* Today banner */}
        {today && (
          <div className="flex items-center gap-4 px-5 py-4 border-b border-[#D4C5A9] bg-[#F5F1EB]">
            <span className="text-3xl" aria-hidden="true">{forecastEmoji(today.shortForecast)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-[#52796F] uppercase tracking-widest">{today.name}</p>
              <p className="text-[#1B4332] font-semibold truncate">{today.shortForecast}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-[var(--font-fraunces)] text-[#1B4332]">
                {today.temperature}°{today.temperatureUnit}
              </p>
              {today.windSpeed && (
                <p className="text-xs text-[#52796F] font-mono">{today.windSpeed} winds</p>
              )}
            </div>
          </div>
        )}

        {/* 5-day strip */}
        {daytimePeriods.length > 1 && (
          <div className="grid grid-cols-5 divide-x divide-[#D4C5A9] border-b border-[#D4C5A9]">
            {daytimePeriods.map((period) => (
              <div key={period.name} className="flex flex-col items-center gap-1 py-3 px-1">
                <p className="text-xs font-mono text-[#52796F] text-center leading-tight">
                  {period.name.replace('This ', '').replace('day', 'day').slice(0, 9)}
                </p>
                <span className="text-xl" aria-hidden="true">{forecastEmoji(period.shortForecast)}</span>
                <p className="text-sm font-semibold text-[#1B4332]">
                  {period.temperature}°
                </p>
                {period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation > 0 && (
                  <p className="text-xs font-mono text-[#52796F]">
                    💧{period.probabilityOfPrecipitation}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Trail condition estimates */}
        <div className="px-5 py-4">
          <p className="text-xs font-mono text-[#52796F] uppercase tracking-widest mb-3">
            Trail Conditions Estimate
          </p>
          <div className="space-y-2">
            {conditions.map((c, i) => (
              <TrailConditionBadge key={i} condition={c} />
            ))}
          </div>
          <p className="text-xs text-[#D4C5A9] mt-3">
            Conditions estimated from NOAA 7-day forecast · Verify with park before visiting
          </p>
        </div>
      </div>
    </section>
  )
}

function TrailConditionBadge({ condition }: { condition: TrailConditionEstimate }) {
  const { label, detail, severity } = condition

  const palette = {
    clear: {
      dot: 'bg-[#40916C]',
      border: 'border-[#D4C5A9]',
      labelColor: 'text-[#1B4332]',
    },
    caution: {
      dot: 'bg-amber-400',
      border: 'border-amber-200',
      labelColor: 'text-amber-800',
    },
    warning: {
      dot: 'bg-red-400',
      border: 'border-red-200',
      labelColor: 'text-red-800',
    },
  }[severity]

  return (
    <div className={`flex gap-3 rounded-lg border px-3 py-2.5 ${palette.border}`}>
      <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${palette.dot}`} />
      <div>
        <p className={`text-sm font-semibold ${palette.labelColor}`}>{label}</p>
        <p className="text-xs text-[#52796F] mt-0.5">{detail}</p>
      </div>
    </div>
  )
}
