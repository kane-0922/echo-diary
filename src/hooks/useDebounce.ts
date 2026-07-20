// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — useDebounce Hook
// Delays updating a value until after `delay` ms of inactivity.
// Used by SearchBar to avoid filtering on every keystroke.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
