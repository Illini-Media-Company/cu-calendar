import clsx from 'clsx'
import type { CalendarEvent } from '../types/events'
import { formatCentralRange } from '../utils/timezone'
import { CategoryBadge } from './CategoryBadge'
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
            className={clsx(styles.eventCard, selectedEventUid === event.uid && styles.eventCardActive)}
            onClick={() => onSelectEvent(event.uid)}
          >
            <div className={styles.eventCardHeader}>
              <h3>{event.name}</h3>
              <CategoryBadge category={event.categoryType} />
            </div>
            <p>{formatCentralRange(event.startDate, event.endDate)}</p>
            <p>{event.address}</p>
            {typeof event.lat !== 'number' || typeof event.long !== 'number' ? (
              <p className={styles.eventMeta}>No map pin for this event yet.</p>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  )
}
