import fs from 'fs'
import path from 'path'
import { MONTH_NAMES, type Month } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'src', 'data', 'parks')

export interface ProbabilityRow {
  park_id: string
  species_slug: string
  month: number
  score: number
  raw_count: number
  weighted_count: number
}

export interface ParkData {
  park_id: string
  park_name: string
  observation_count_total: number
  observation_count_wildlife: number
  alerts: NpsAlert[]
  probability_matrix: ProbabilityRow[]
}

export interface NpsAlert {
  source: string
  park_code: string
  title: string
  description: string
  category: string
  url: string
}

export interface SpeciesSummary {
  slug: string
  peakScore: number
  peakMonth: number
  monthlyScores: { month: number; score: number }[]
}

function loadParkData(parkId: string): ParkData | null {
  const filePath = path.join(DATA_DIR, `${parkId}.json`)
  if (!fs.existsSync(filePath)) return null
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as ParkData
}

export function getParkSpecies(parkId: string): SpeciesSummary[] {
  const data = loadParkData(parkId)
  if (!data) return []

  const bySpecies = new Map<string, { month: number; score: number }[]>()
  for (const row of data.probability_matrix) {
    if (!bySpecies.has(row.species_slug)) bySpecies.set(row.species_slug, [])
    bySpecies.get(row.species_slug)!.push({ month: row.month, score: row.score })
  }

  return Array.from(bySpecies.entries())
    .map(([slug, months]) => {
      const sorted = months.sort((a, b) => b.score - a.score)
      return {
        slug,
        peakScore: sorted[0].score,
        peakMonth: sorted[0].month,
        monthlyScores: months.sort((a, b) => a.month - b.month),
      }
    })
    .sort((a, b) => b.peakScore - a.peakScore)
}

export function getParkSpeciesForMonth(parkId: string, month: number): ProbabilityRow[] {
  const data = loadParkData(parkId)
  if (!data) return []
  return data.probability_matrix
    .filter((r) => r.month === month)
    .sort((a, b) => b.score - a.score)
}

export function getSpeciesSeasonality(
  parkId: string,
  speciesSlug: string
): { month: number; monthName: string; score: number }[] {
  const data = loadParkData(parkId)
  if (!data) return []

  const rows = data.probability_matrix.filter((r) => r.species_slug === speciesSlug)
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const row = rows.find((r) => r.month === month)
    return {
      month,
      monthName: MONTH_NAMES[month as Month],
      score: row?.score ?? 0,
    }
  })
}

export function getParkAlerts(parkId: string): NpsAlert[] {
  const data = loadParkData(parkId)
  return data?.alerts ?? []
}

export function hasParkData(parkId: string): boolean {
  return fs.existsSync(path.join(DATA_DIR, `${parkId}.json`))
}
