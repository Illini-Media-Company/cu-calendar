import clsx from 'clsx'
import type { QueryState } from '../types/query'
import styles from '../styles/App.module.css'

interface FilterToolbarProps {
  queryState: QueryState
  categories: string[]
  onQueryChange: (patch: Partial<QueryState>) => void
}

export function FilterToolbar({
  queryState,
  categories,
  onQueryChange,
}: FilterToolbarProps) {
  return (
    <section className={styles.toolbar} aria-label="Event filters">
      <div className={styles.toolbarMain}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>View</span>
          <div className={styles.segmentedControl} role="tablist" aria-label="View mode">
            <button
              className={clsx(styles.segmentButton, queryState.view === 'map' && styles.segmentButtonActive)}
              type="button"
              onClick={() => onQueryChange({ view: 'map' })}
              aria-pressed={queryState.view === 'map'}
            >
              Map
            </button>
            <button
              className={clsx(styles.segmentButton, queryState.view === 'calendar' && styles.segmentButtonActive)}
              type="button"
              onClick={() => onQueryChange({ view: 'calendar' })}
              aria-pressed={queryState.view === 'calendar'}
            >
              Calendar
            </button>
          </div>
        </div>

        <label className={styles.controlGroup}>
          <span className={styles.controlLabel}>Category</span>
          <select
            className={styles.input}
            value={queryState.category}
            onChange={(event) => onQueryChange({ category: event.target.value })}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.controlGroup}>
          <span className={styles.controlLabel}>Search</span>
          <input
            className={styles.input}
            type="search"
            placeholder="Search title, location, or keyword"
            value={queryState.q}
            onChange={(event) => onQueryChange({ q: event.target.value })}
          />
        </label>

        <label className={styles.controlGroup}>
          <span className={styles.controlLabel}>Start</span>
          <input
            className={styles.input}
            type="date"
            value={queryState.start}
            onChange={(event) => onQueryChange({ start: event.target.value })}
          />
        </label>

        <label className={styles.controlGroup}>
          <span className={styles.controlLabel}>End</span>
          <input
            className={styles.input}
            type="date"
            value={queryState.end}
            onChange={(event) => onQueryChange({ end: event.target.value })}
          />
        </label>
      </div>

    </section>
  )
}
