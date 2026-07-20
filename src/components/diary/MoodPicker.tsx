// ═══════════════════════════════════════════════════════════════════════
// EchoDiary — Mood Picker
// 6 mood options in a responsive grid. Single-select with highlight.
// ═══════════════════════════════════════════════════════════════════════

import type { Mood } from '../../types'
import { MOODS, MOOD_EMOJI } from '../../types'
import styles from './DiaryEditPage.module.css'

interface MoodPickerProps {
  selected: Mood | null
  onChange: (mood: Mood | null) => void
}

export default function MoodPicker({ selected, onChange }: MoodPickerProps) {
  function handleSelect(mood: Mood) {
    // Toggle: clicking the selected mood deselects it
    onChange(selected === mood ? null : mood)
  }

  return (
    <div className={styles.moodGrid} role="radiogroup" aria-label="选择心情">
      {MOODS.map((mood) => (
        <button
          key={mood}
          className={
            selected === mood ? styles.moodBtnSelected : styles.moodBtn
          }
          onClick={() => handleSelect(mood)}
          role="radio"
          aria-checked={selected === mood}
          aria-label={mood}
          title={mood}
        >
          <span className={styles.moodEmoji} aria-hidden="true">
            {MOOD_EMOJI[mood]}
          </span>
          <span className={styles.moodName}>{mood}</span>
        </button>
      ))}
    </div>
  )
}
