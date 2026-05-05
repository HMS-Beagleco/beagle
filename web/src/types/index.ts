export interface Park {
  id: string
  slug: string
  name: string
  state: string
  description: string
  bounding_box: BoundingBox
  image_url?: string
  nps_park_code: string
}

export interface Species {
  id: string
  slug: string
  common_name: string
  scientific_name: string
  taxon_id_inat: number
  taxon_group: TaxonGroup
  description?: string
  image_url?: string
}

export interface WildlifeProbability {
  park_id: string
  species_id: string
  month: number
  score: number // 0–1.0
  observation_count: number
  observer_count: number
  last_updated: string
}

export interface Observation {
  id: string
  park_id: string
  species_id: string
  observed_at: string
  lat: number
  lng: number
  quality_grade: 'research' | 'needs_id' | 'casual'
  source: 'inat' | 'ebird' | 'community'
  photo_url?: string
  trail_name?: string
}

export interface TrailReport {
  id: string
  park_id: string
  trail_name: string
  trail_slug: string
  conditions: TrailCondition
  last_updated: string
  source: 'nps' | 'community'
  notes?: string
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

export type TaxonGroup = 'mammal' | 'bird' | 'reptile' | 'amphibian' | 'fish' | 'invertebrate' | 'plant' | 'fungi'
export type TrailCondition = 'open' | 'closed' | 'caution' | 'unknown'
export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export const MONTH_NAMES: Record<Month, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December',
}
