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

export interface Trailhead {
  id: string
  park_id: string
  name: string
  lat: number
  lng: number
  osm_id?: number
}

export interface TrailheadScore {
  trailhead_id: string
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
  trailheads: Trailhead[]
  probability_matrix: ProbabilityRow[]
  trailhead_probability: TrailheadScore[]
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

export function getParkTrailheads(parkId: string): Trailhead[] {
  const data = loadParkData(parkId)
  return data?.trailheads ?? []
}

export function getTrailheadScores(parkId: string): TrailheadScore[] {
  const data = loadParkData(parkId)
  return data?.trailhead_probability ?? []
}

export function getParkCenter(parkId: string): [number, number] {
  const data = loadParkData(parkId)
  if (!data || !data.trailheads?.length) return [44.5, -110.5]
  const lats = data.trailheads.map((t) => t.lat)
  const lngs = data.trailheads.map((t) => t.lng)
  return [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ]
}

export function getParkAlerts(parkId: string): NpsAlert[] {
  const data = loadParkData(parkId)
  return data?.alerts ?? []
}

export function hasParkData(parkId: string): boolean {
  return fs.existsSync(path.join(DATA_DIR, `${parkId}.json`))
}

// Mirrors the pipeline's CANONICAL_SLUGS map so current JSON data is also deduplicated.
// null = exclude (taxonomic group node, not an identifiable species).
const CANONICAL_SLUGS: Record<string, string | null> = {
  'american-black-bear': 'black-bear', 'california-black-bear': 'black-bear',
  'eastern-black-bear': 'black-bear', 'pacific-black-bear': 'black-bear',
  'brown-bear': 'grizzly-bear', 'holarctic-bears': null,
  'shiras-moose': 'moose', 'alaskan-moose': 'moose',
  'rocky-mountain-mule-deer': 'mule-deer', 'california-mule-deer': 'mule-deer',
  'northern-white-tailed-deer': 'white-tailed-deer',
  'northern-rocky-mountains-white-tailed-deer': 'white-tailed-deer',
  'virginia-white-tailed-deer': 'white-tailed-deer',
  'florida-white-tailed-deer': 'white-tailed-deer',
  'northern-bald-eagle': 'bald-eagle', 'north-american-golden-eagle': 'golden-eagle',
  'northwestern-wolf': 'gray-wolf',
  'eastern-american-red-fox': 'red-fox', 'rocky-mountain-red-fox': 'red-fox',
  'typical-foxes': null,
  'eastern-red-tailed-hawk': 'red-tailed-hawk', 'western-red-tailed-hawk': 'red-tailed-hawk',
  'florida-red-tailed-hawk': 'red-tailed-hawk',
  'northern-sharp-shinned-hawk': 'sharp-shinned-hawk',
  'northern-broad-winged-hawk': 'broad-winged-hawk',
  'california-red-shouldered-hawk': 'red-shouldered-hawk',
  'florida-red-shouldered-hawk': 'red-shouldered-hawk',
  'eastern-green-heron': 'green-heron',
  'american-great-gray-owl': 'great-gray-owl', 'northern-barred-owl': 'barred-owl',
  'gray-canada-jay': 'canada-jay', 'rocky-mountain-jay': 'canada-jay', 'oregon-jay': 'canada-jay',
  'black-headed-stellers-jay': 'stellers-jay', 'blue-fronted-stellers-jay': 'stellers-jay',
  'long-crested-stellers-jay': 'stellers-jay',
  'eastern-hairy-woodpecker': 'hairy-woodpecker',
  'northern-pileated-woodpecker': 'pileated-woodpecker',
  'southern-pileated-woodpecker': 'pileated-woodpecker',
  'rocky-mts-three-toed-woodpecker': 'american-three-toed-woodpecker',
  'pied-woodpeckers-and-allies': null,
  'eastern-song-sparrow': 'song-sparrow', 'mountain-song-sparrow': 'song-sparrow',
  'eastern-chipping-sparrow': 'chipping-sparrow', 'western-chipping-sparrow': 'chipping-sparrow',
  'eastern-field-sparrow': 'field-sparrow',
  'gambels-white-crowned-sparrow': 'white-crowned-sparrow',
  'mountain-white-crowned-sparrow': 'white-crowned-sparrow',
  'montane-lincolns-sparrow': 'lincolns-sparrow',
  'south-florida-blue-jay': 'blue-jay', 'spizella-sparrows': null,
  'aleutian-sooty-fox-sparrow': 'fox-sparrow', 'mono-thick-billed-fox-sparrow': 'fox-sparrow',
  'audubons-warbler': 'yellow-rumped-warbler', 'myrtle-warbler': 'yellow-rumped-warbler',
  'northern-yellow-warbler': 'yellow-warbler', 'rocky-mountain-yellow-warbler': 'yellow-warbler',
  'western-palm-warbler': 'palm-warbler',
  'mole-salamanders': null, 'deirochelyine-turtles': null, 'watersnakes': null,
  'spiny-lizards': null, 'pine-squirrels': null, 'long-tailed-ground-squirrels': null,
  'american-water-frogs': null,
}

function canonicalSlug(slug: string): string | null {
  return slug in CANONICAL_SLUGS ? CANONICAL_SLUGS[slug] : slug
}

export interface CrossParkSpecies {
  slug: string
  name: string
  peakScore: number
  peakMonth: number
  bestPark: string
  parkCount: number
  currentMonthScore: number
}

export function getAllSpecies(currentMonth: number, parkIds: string[]): CrossParkSpecies[] {
  // slug → { peakScore, peakMonth, bestPark, parks, currentMonthScore }
  const map = new Map<string, {
    peakScore: number; peakMonth: number; bestPark: string
    parks: Set<string>; currentMonthScore: number
  }>()

  for (const parkId of parkIds) {
    const data = loadParkData(parkId)
    if (!data) continue

    for (const row of data.probability_matrix) {
      const slug = canonicalSlug(row.species_slug)
      if (!slug) continue

      const existing = map.get(slug)
      const isCurrentMonth = row.month === currentMonth

      if (!existing) {
        map.set(slug, {
          peakScore: row.score,
          peakMonth: row.month,
          bestPark: parkId,
          parks: new Set([parkId]),
          currentMonthScore: isCurrentMonth ? row.score : 0,
        })
      } else {
        existing.parks.add(parkId)
        if (row.score > existing.peakScore) {
          existing.peakScore = row.score
          existing.peakMonth = row.month
          existing.bestPark = parkId
        }
        if (isCurrentMonth && row.score > existing.currentMonthScore) {
          existing.currentMonthScore = row.score
        }
      }
    }
  }

  return Array.from(map.entries())
    .map(([slug, s]) => ({
      slug,
      name: slug.replace(/-/g, ' '),
      peakScore: s.peakScore,
      peakMonth: s.peakMonth,
      bestPark: s.bestPark,
      parkCount: s.parks.size,
      currentMonthScore: s.currentMonthScore,
    }))
    .sort((a, b) => b.peakScore - a.peakScore)
}
