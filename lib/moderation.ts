import leoProfanity from "leo-profanity";

// leo-profanity ships an English dictionary loaded by default. Guard init so
// repeated imports don't re-add words.
let initialized = false;
function ensureLoaded() {
  if (initialized) return;
  leoProfanity.loadDictionary("en");
  initialized = true;
}

/** Returns true if the text contains profanity. */
export function isProfane(text: string | null | undefined): boolean {
  if (!text) return false;
  ensureLoaded();
  return leoProfanity.check(text);
}

/** Replaces profane words with asterisks. Used to sanitize AI output. */
export function maskProfanity(text: string | null | undefined): string {
  if (!text) return text ?? "";
  ensureLoaded();
  return leoProfanity.clean(text);
}

/**
 * Screens multiple named fields for profanity. Returns the first offending
 * field label, or null if all are clean. Used to reject user input.
 */
export function screenFields(
  fields: Record<string, string | null | undefined>
): string | null {
  for (const [label, value] of Object.entries(fields)) {
    if (isProfane(value)) return label;
  }
  return null;
}
