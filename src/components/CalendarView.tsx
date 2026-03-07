import {
  Calendar,
  dateFnsLocalizer,
  type View,
  type Event as BigCalendarEvent,
} from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import type { CalendarEvent, CalendarMode } from '../types/events'
import { toCalendarDate } from '../utils/timezone'
import styles from '../styles/App.module.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarViewProps {
  events: CalendarEvent[]
  mode: CalendarMode
  onModeChange: (mode: CalendarMode) => void
  onSelectEvent: (uid: string) => void
}

interface UICalendarEvent extends BigCalendarEvent {
  resource: CalendarEvent
}

function mapToCalendarEvents(events: CalendarEvent[]): UICalendarEvent[] {
  return events.map((event) => ({
    title: event.name,
    start: toCalendarDate(event.startDate),
    end: toCalendarDate(event.endDate),
    allDay: false,
    resource: event,
  }))
}

export function CalendarView({
  events,
  mode,
  onModeChange,
  onSelectEvent,
}: CalendarViewProps) {
  const calendarEvents = mapToCalendarEvents(events)
  const activeView: View = mode === 'list' ? 'agenda' : 'month'

  return (
    <section className={styles.calendarPanel} aria-label="Calendar view">
      <div className={styles.calendarTopBar}>
        <span className={styles.controlLabel}>Calendar mode</span>
        <div className={styles.segmentedControl}>
          <button
            type="button"
            className={`${styles.segmentButton} ${mode === 'month' ? styles.segmentButtonActive : ''}`}
            onClick={() => onModeChange('month')}
            aria-pressed={mode === 'month'}
          >
            Month
          </button>
          <button
            type="button"
            className={`${styles.segmentButton} ${mode === 'list' ? styles.segmentButtonActive : ''}`}
            onClick={() => onModeChange('list')}
            aria-pressed={mode === 'list'}
          >
            List
          </button>
        </div>
      </div>

      <div className={styles.calendarCanvas}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          view={activeView}
          views={['month', 'agenda']}
          onView={(view) => {
            onModeChange(view === 'agenda' ? 'list' : 'month')
          }}
          onSelectEvent={(event) => {
            const calendarEvent = event as UICalendarEvent
            onSelectEvent(calendarEvent.resource.uid)
          }}
          popup
          step={30}
          length={30}
          toolbar
        />
      </div>
    </section>
  )
}
