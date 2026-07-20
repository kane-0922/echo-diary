// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — ID Generator
// NanoID-compatible unique IDs without external dependency.
// Format: kebab-like short IDs, ~12 characters, URL-safe.
// ═══════════════════════════════════════════════════════════════════════

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const TIMESTAMP_RADIX = 36

/** Generate a short unique ID. Collision risk is negligible for client-side use. */
export function generateId(prefix?: string): string {
  const timePart = Date.now().toString(TIMESTAMP_RADIX)
  const randomPart = Array.from({ length: 8 }, () =>
    ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length)),
  ).join('')

  const id = `${timePart}-${randomPart}`
  return prefix ? `${prefix}_${id}` : id
}

/** Generate an ISO 8601 timestamp string for the current moment. */
export function nowISO(): string {
  return new Date().toISOString()
}

/** Generate today's date as YYYY-MM-DD. */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}
