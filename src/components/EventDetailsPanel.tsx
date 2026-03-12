import clsx from 'clsx'
import type { CalendarEvent } from '../types/events'
import { formatCentralRange } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
import { FeaturedBadge } from './FeaturedBadge'
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
    <aside
      className={clsx(styles.detailsPanel, event.highlight && styles.detailsPanelFeatured)}
      aria-live="polite"
    >
      <div className={styles.detailsHeading}>
        <h2>{event.title}</h2>
        <button type="button" className={styles.inlineLinkButton} onClick={onClear}>
          Clear
        </button>
      </div>

      {event.images[0] ? <img className={styles.detailsImage} src={event.images[0]} alt="Event" /> : null}

      <div className={styles.detailsBadges}>
        {event.highlight ? <FeaturedBadge /> : null}
        <CategoryBadge category={event.event_type} />
      </div>
      <p>{formatCentralRange(event.start_date, event.end_date)}</p>
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
