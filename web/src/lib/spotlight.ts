// Charismatic species shown as primary toggles on park map pages.
// Order matters — shown left-to-right as prominent buttons.
// Parks only show species from this list that actually have data.

export const SPOTLIGHT_SPECIES: string[] = [
  // Large mammals
  'grizzly-bear',
  'black-bear',
  'moose',
  'gray-wolf',
  'bison',
  'elk',
  'mountain-lion',
  'bighorn-sheep',
  'mountain-goat',
  'pronghorn',
  'mule-deer',
  'white-tailed-deer',
  'caribou',
  'manatee',
  'american-alligator',
  // Large raptors
  'bald-eagle',
  'golden-eagle',
  'osprey',
  'great-horned-owl',
  'great-gray-owl',
  'snowy-owl',
  'peregrine-falcon',
]

export function getSpotlightForPark(availableSlugs: string[]): string[] {
  const available = new Set(availableSlugs)
  return SPOTLIGHT_SPECIES.filter((s) => available.has(s))
}
