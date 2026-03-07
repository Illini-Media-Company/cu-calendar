import type { CalendarEvent } from '../types/events'
import { formatCentralRange, getCentralTimezoneLabel } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
import styles from '../styles/App.module.css'

interface EventDetailsPanelProps {
  event: CalendarEvent | null
  onClear: () => void
}

export function EventDetailsPanel({ event, onClear }: EventDetailsPanelProps) {
  if (!event) {
    return (
      <aside className={styles.detailsPanel} aria-live="polite">
        <h2>Event details</h2>
        <p>Select an event from the map or calendar to view details.</p>
      </aside>
    )
  }

  return (
    <aside className={styles.detailsPanel} aria-live="polite">
      <div className={styles.detailsHeading}>
        <h2>{event.name}</h2>
        <button type="button" className={styles.inlineLinkButton} onClick={onClear}>
          Clear
        </button>
      </div>

      {event.image ? <img className={styles.detailsImage} src={event.image} alt="Event" /> : null}

      <CategoryBadge category={event.categoryType} />
      <p>{formatCentralRange(event.startDate, event.endDate)}</p>
      <p className={styles.eventMeta}>Timezone: {getCentralTimezoneLabel()} (CT)</p>
      <p>{event.address}</p>
      <p>{event.description || 'Description coming soon.'}</p>

      {event.url ? (
        <a href={event.url} target="_blank" rel="noreferrer" className={styles.primaryLink}>
          Event website
        </a>
      ) : null}
    </aside>
  )
}
