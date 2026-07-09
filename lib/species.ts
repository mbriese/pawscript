// Single source of truth for the fixed pet species list and their default
// avatar emojis. Imported by both the client form and server-side validation
// so the option list and emoji map never drift out of sync.

export const SPECIES = [
  "dog",
  "cat",
  "bird",
  "fish",
  "rabbit",
  "snake",
  "mouse",
  "rat",
  "hamster",
  "highland cow",
  "cow",
  "horse",
  "virtual pet",
  "chicken",
  "duck",
] as const;

export type Species = (typeof SPECIES)[number];

export const SPECIES_EMOJI: Record<Species, string> = {
  dog: "🐕",
  cat: "🐈",
  bird: "🐦",
  fish: "🐟",
  rabbit: "🐰",
  snake: "🐍",
  mouse: "🐭",
  rat: "🐀",
  hamster: "🐹",
  "highland cow": "🐮",
  cow: "🐄",
  horse: "🐴",
  "virtual pet": "🐉",
  chicken: "🐔",
  duck: "🦆",
};

export const DEFAULT_SPECIES: Species = SPECIES[0];

/** Default avatar emoji for a species, falling back to the paw print. */
export function speciesEmoji(species: string): string {
  return (SPECIES_EMOJI as Record<string, string>)[species] ?? "🐾";
}

/** Title-cased label for display, e.g. "highland cow" -> "Highland Cow". */
export function speciesLabel(species: string): string {
  return species.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isSpecies(value: string): value is Species {
  return (SPECIES as readonly string[]).includes(value);
}
