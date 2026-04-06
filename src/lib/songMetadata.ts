/**
 * Normalizes a primary artist string for persistence and future local search.
 * Returns `undefined` when the value is missing or only whitespace.
 */
export function normalizePrimaryArtist(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t && t.length > 0 ? t : undefined;
}
