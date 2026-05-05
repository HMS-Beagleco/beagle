'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { Trailhead, TrailheadScore } from '@/lib/data'
import { MONTH_NAMES, type Month } from '@/types'

interface Props {
  trailheads: Trailhead[]
  scores: TrailheadScore[]
  selectedSpecies: string | null
  month: number
  parkCenter: [number, number]
  parkZoom?: number
}

// Fly map to a new center when selectedSpecies changes
function FlyToTop({
  trailheads,
  scores,
  selectedSpecies,
  month,
}: {
  trailheads: Trailhead[]
  scores: TrailheadScore[]
  selectedSpecies: string | null
  month: number
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedSpecies) return
    const best = scores
      .filter((s) => s.species_slug === selectedSpecies && s.month === month)
      .sort((a, b) => b.score - a.score)[0]
    if (!best) return
    const th = trailheads.find((t) => t.id === best.trailhead_id)
    if (th) map.flyTo([th.lat, th.lng], 13, { duration: 1 })
  }, [selectedSpecies, month, scores, trailheads, map])

  return null
}

function scoreToRadius(score: number) {
  return 6 + score * 14 // 6px min, 20px max
}

function scoreToColor(score: number) {
  if (score >= 0.75) return '#40916C'
  if (score >= 0.5) return '#52796F'
  if (score >= 0.25) return '#D4C5A9'
  return '#b0b0b0'
}

export default function ParkMap({
  trailheads,
  scores,
  selectedSpecies,
  month,
  parkCenter,
  parkZoom = 10,
}: Props) {
  const [ready, setReady] = useState(false)

  // Leaflet requires the DOM — defer render until client
  useEffect(() => { setReady(true) }, [])
  if (!ready) {
    return (
      <div className="w-full h-[480px] bg-[#F5F1EB] border border-[#D4C5A9] rounded-xl flex items-center justify-center">
        <p className="text-sm font-mono text-[#52796F]">Loading map…</p>
      </div>
    )
  }

  // For each trailhead, find the top score for the selected species+month,
  // or the overall top score for that trailhead this month
  const trailheadScores = trailheads.map((th) => {
    const relevant = scores.filter(
      (s) =>
        s.trailhead_id === th.id &&
        s.month === month &&
        (!selectedSpecies || s.species_slug === selectedSpecies)
    )
    const topScore = relevant.sort((a, b) => b.score - a.score)[0]
    const topSpeciesThisMonth = scores
      .filter((s) => s.trailhead_id === th.id && s.month === month)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    return { th, score: topScore?.score ?? 0, topSpecies: topSpeciesThisMonth }
  })

  const monthName = MONTH_NAMES[month as Month]

  return (
    <MapContainer
      center={parkCenter}
      zoom={parkZoom}
      style={{ height: '480px', width: '100%', borderRadius: '12px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToTop
        trailheads={trailheads}
        scores={scores}
        selectedSpecies={selectedSpecies}
        month={month}
      />
      {trailheadScores.map(({ th, score, topSpecies }) => (
        <CircleMarker
          key={th.id}
          center={[th.lat, th.lng]}
          radius={scoreToRadius(score)}
          pathOptions={{
            fillColor: scoreToColor(score),
            fillOpacity: 0.85,
            color: '#fff',
            weight: 2,
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <p className="font-semibold text-[#1B4332] mb-1">{th.name}</p>
              <p className="text-xs text-[#52796F] mb-2 font-mono">{monthName} wildlife</p>
              {topSpecies.length > 0 ? (
                <ul className="space-y-1">
                  {topSpecies.map((s) => (
                    <li key={s.species_slug} className="flex justify-between text-xs gap-3">
                      <span className="capitalize text-[#2D3436]">
                        {s.species_slug.replace(/-/g, ' ')}
                      </span>
                      <span className="font-mono text-[#40916C] font-medium">
                        {Math.round(s.score * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#D4C5A9]">No data for this month</p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
