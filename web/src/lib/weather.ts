// Server-only — import only in RSCs, never in client components.

const USER_AGENT = 'BeagleWildlifeApp/1.0 (https://beagle-guide.vercel.app)'

export interface ForecastPeriod {
  name: string
  isDaytime: boolean
  temperature: number
  temperatureUnit: string
  windSpeed: string
  shortForecast: string
  probabilityOfPrecipitation: number | null
}

export interface ParkWeather {
  periods: ForecastPeriod[]
  timezone: string
  fetchedAt: string
}

export type ConditionSeverity = 'clear' | 'caution' | 'warning'

export interface TrailConditionEstimate {
  label: string
  detail: string
  severity: ConditionSeverity
}

export async function fetchParkWeather(lat: number, lng: number): Promise<ParkWeather | null> {
  try {
    const pointsRes = await fetch(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
      {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' },
        next: { revalidate: 7200 },
      },
    )
    if (!pointsRes.ok) return null

    const points = await pointsRes.json()
    const forecastUrl: string = points?.properties?.forecast
    const timezone: string = points?.properties?.timeZone ?? 'America/Denver'
    if (!forecastUrl) return null

    const forecastRes = await fetch(forecastUrl, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' },
      next: { revalidate: 3600 },
    })
    if (!forecastRes.ok) return null

    const forecastData = await forecastRes.json()
    const raw: any[] = forecastData?.properties?.periods ?? []

    const periods: ForecastPeriod[] = raw.slice(0, 10).map((p) => ({
      name: p.name,
      isDaytime: p.isDaytime,
      temperature: p.temperature,
      temperatureUnit: p.temperatureUnit ?? 'F',
      windSpeed: p.windSpeed ?? '',
      shortForecast: p.shortForecast ?? '',
      probabilityOfPrecipitation:
        typeof p.probabilityOfPrecipitation?.value === 'number'
          ? p.probabilityOfPrecipitation.value
          : null,
    }))

    return { periods, timezone, fetchedAt: new Date().toISOString() }
  } catch {
    return null
  }
}

export function deriveTrailConditions(weather: ParkWeather): TrailConditionEstimate {
  const next3Days = weather.periods.slice(0, 6)
  const lowerForecasts = next3Days.map((p) => p.shortForecast.toLowerCase())
  const temps = next3Days.map((p) =>
    p.temperatureUnit === 'C' ? p.temperature * 9 / 5 + 32 : p.temperature,
  )
  const maxPrecipProb = Math.max(...next3Days.map((p) => p.probabilityOfPrecipitation ?? 0))

  const hasSnow = lowerForecasts.some((f) => f.includes('snow') || f.includes('blizzard') || f.includes('flurr'))
  const hasIce = lowerForecasts.some((f) => f.includes('ice') || f.includes('sleet') || f.includes('freezing'))
  const hasRain = lowerForecasts.some((f) => f.includes('rain') || f.includes('shower') || f.includes('storm'))
  const freezingTemps = temps.some((t) => t <= 32)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)

  if (hasSnow) {
    return { label: 'Snow in forecast', detail: 'Trails may be snow-covered or icy. Traction devices recommended.', severity: 'warning' }
  }
  if (hasIce) {
    return { label: 'Ice possible', detail: 'Freezing precipitation expected. Watch for icy patches in shaded areas.', severity: 'warning' }
  }
  if (freezingTemps && maxPrecipProb >= 30) {
    return { label: 'Freeze-thaw conditions', detail: `Temps dropping to ${Math.round(minTemp)}°F. Wet areas may ice overnight.`, severity: 'caution' }
  }
  if (hasRain && maxPrecipProb >= 50) {
    return { label: 'Muddy conditions likely', detail: `${maxPrecipProb}% chance of rain. Expect soft ground and slippery roots.`, severity: 'caution' }
  }
  if (maxPrecipProb >= 30) {
    return { label: 'Some mud possible', detail: `${maxPrecipProb}% chance of precipitation over the next few days.`, severity: 'caution' }
  }
  return {
    label: 'Clear conditions expected',
    detail: maxTemp >= 32 ? 'No significant weather hazards in the forecast.' : `Cold but dry — temperatures around ${Math.round(maxTemp)}°F.`,
    severity: 'clear',
  }
}

export function forecastEmoji(shortForecast: string): string {
  const f = shortForecast.toLowerCase()
  if (f.includes('thunderstorm') || f.includes('t-storm')) return '⛈️'
  if (f.includes('blizzard') || f.includes('heavy snow')) return '🌨️'
  if (f.includes('snow') || f.includes('flurr')) return '❄️'
  if (f.includes('sleet') || f.includes('ice') || f.includes('freezing')) return '🌨️'
  if (f.includes('rain') || f.includes('shower') || f.includes('drizzle')) return '🌧️'
  if (f.includes('fog') || f.includes('mist')) return '🌫️'
  if (f.includes('windy') || f.includes('breezy')) return '💨'
  if (f.includes('partly cloudy') || f.includes('partly sunny') || f.includes('mostly cloudy')) return '⛅'
  if (f.includes('cloudy') || f.includes('overcast')) return '☁️'
  if (f.includes('sunny') || f.includes('clear')) return '☀️'
  return '🌤️'
}
