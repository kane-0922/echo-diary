// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Search Bar
// Debounced search input with icon and clear button.
// ═══════════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import styles from './DiaryListPage.module.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = '搜索日记…',
}: SearchBarProps) {
  const handleClear = useCallback(() => onChange(''), [onChange])

  return (
    <div className={styles.searchBar}>
      {/* Search icon */}
      <svg
        className={styles.searchIcon}
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="5" />
        <path d="M13 13l4 4" />
      </svg>

      <input
        className={styles.searchInput}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="搜索日记"
      />

      {value && (
        <button
          className={styles.searchClear}
          onClick={handleClear}
          aria-label="清除搜索"
          title="清除"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 5l10 10M15 5l-10 10" />
          </svg>
        </button>
      )}
    </div>
  )
}
