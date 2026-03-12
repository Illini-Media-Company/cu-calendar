import clsx from 'clsx'
import type { CalendarEvent } from '../types/events'
import { formatCentralRange } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
import { FeaturedBadge } from './FeaturedBadge'
import styles from '../styles/App.module.css'

interface EventListProps {
  events: CalendarEvent[]
  selectedEventUid: string
  onSelectEvent: (uid: string) => void
}

export function EventList({ events, selectedEventUid, onSelectEvent }: EventListProps) {
  if (events.length === 0) {
    return <p className={styles.emptyState}>No events match the current filters.</p>
  }

  return (
    <ul className={styles.eventList} aria-label="Filtered event list">
      {events.map((event) => (
        <li key={event.uid}>
          <button
            type="button"
            className={clsx(
              styles.eventCard,
              event.highlight && styles.eventCardFeatured,
              selectedEventUid === event.uid && styles.eventCardActive,
            )}
            onClick={() => onSelectEvent(event.uid)}
            title={event.title}
          >
            <div className={styles.eventCardHeader}>
              <div className={styles.eventCardTitleGroup}>
                <h3 className={styles.eventCardTitle}>{event.title}</h3>
              </div>
              <div className={styles.eventCardBadges}>
                {event.highlight ? <FeaturedBadge compact className={styles.eventListFeaturedBadge} /> : null}
                <CategoryBadge category={event.event_type} className={styles.eventListCategoryBadge} />
              </div>
            </div>
            <p className={styles.eventCardText}>{formatCentralRange(event.start_date, event.end_date)}</p>
            <p className={styles.eventCardText}>{event.address}</p>
            {typeof event.lat !== 'number' || typeof event.long !== 'number' ? (
              <p className={styles.eventMeta}>No map pin for this event yet.</p>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  )
}
