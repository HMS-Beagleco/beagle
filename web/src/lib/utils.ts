import { Month, MONTH_NAMES, WildlifeProbability } from '@/types'

export function scoreToLabel(score: number): string {
  if (score >= 0.75) return 'Very Likely'
  if (score >= 0.5) return 'Likely'
  if (score >= 0.25) return 'Possible'
  return 'Unlikely'
}

export function scoreToColor(score: number): string {
  if (score >= 0.75) return 'text-green-700'
  if (score >= 0.5) return 'text-lime-600'
  if (score >= 0.25) return 'text-amber-600'
  return 'text-slate-400'
}

export function getBestMonths(probabilities: WildlifeProbability[], threshold = 0.5): Month[] {
  return probabilities
    .filter((p) => p.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map((p) => p.month as Month)
}

export function monthName(month: Month): string {
  return MONTH_NAMES[month]
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
