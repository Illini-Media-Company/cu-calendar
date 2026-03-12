import {
  Calendar,
  dateFnsLocalizer,
  type NavigateAction,
  type ToolbarProps,
  type View,
  type Event as BigCalendarEvent,
} from 'react-big-calendar'
import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDay,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useState } from 'react'
import type { CalendarEvent, CalendarMode } from '../types/events'
import { getCategoryAppearance } from '../utils/categoryAppearance'
import { FEATURED_COLORS, FEATURED_LABEL } from '../utils/featuredEvents'
import { toCalendarDate } from '../utils/timezone'
import { FeaturedBadge } from './FeaturedBadge'
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

function CalendarToolbar({
  date,
  label,
  localizer,
  onNavigate,
  view,
}: ToolbarProps<UICalendarEvent>) {
  const navigate = (action: NavigateAction) => {
    onNavigate(action)
  }
  const displayLabel = view === 'agenda' ? format(date, 'MMMM yyyy') : label

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={() => navigate('TODAY')}>
          {localizer.messages.today}
        </button>
        <button type="button" onClick={() => navigate('PREV')}>
          {localizer.messages.previous}
        </button>
        <button type="button" onClick={() => navigate('NEXT')}>
          {localizer.messages.next}
        </button>
      </span>
      <span className="rbc-toolbar-label">{displayLabel}</span>
    </div>
  )
}

function MonthEventLabel({ event }: { event: UICalendarEvent }) {
  const appearance = getCategoryAppearance(event.resource.event_type)

  return (
    <span className={styles.calendarMonthEventLabel}>
      <span className={styles.calendarEventText}>{event.title}</span>
      <i
        className={`bi ${appearance.iconClass} ${styles.calendarMonthEventGlyph}`}
        aria-hidden="true"
      ></i>
      {event.resource.highlight ? (
        <span
          className={styles.calendarMonthFeaturedMarker}
          role="img"
          aria-label={`${FEATURED_LABEL} event`}
        >
          <i className="bi bi-star-fill" aria-hidden="true"></i>
        </span>
      ) : null}
    </span>
  )
}

function AgendaEventLabel({ event }: { event: UICalendarEvent }) {
  const appearance = getCategoryAppearance(event.resource.event_type)

  return (
    <span className={styles.calendarAgendaEventLabel}>
      {event.resource.highlight ? <FeaturedBadge className={styles.calendarFeaturedAgendaBadge} /> : null}
      <span className={styles.calendarEventLabel}>
        <i className={`bi ${appearance.iconClass} ${styles.calendarEventGlyph}`} aria-hidden="true"></i>
        <span className={styles.calendarEventText}>{event.title}</span>
      </span>
    </span>
  )
}

function mapToCalendarEvents(
  events: CalendarEvent[],
  prioritizeFeaturedInMonth: boolean,
): UICalendarEvent[] {
  return events.map((event) => ({
    title: event.title,
    start: toCalendarDate(event.start_date),
    end: toCalendarDate(event.end_date),
    allDay: prioritizeFeaturedInMonth ? event.highlight : false,
    resource: event,
  }))
}

export function CalendarView({
  events,
  mode,
  onModeChange,
  onSelectEvent,
}: CalendarViewProps) {
  const [visibleDate, setVisibleDate] = useState(() => new Date())
  const activeView: View = mode === 'list' ? 'agenda' : 'month'
  const calendarEvents = mapToCalendarEvents(events, activeView === 'month')
  const calendarDate = mode === 'list' ? startOfMonth(visibleDate) : visibleDate
  const calendarLength =
    mode === 'list'
      ? differenceInCalendarDays(endOfMonth(visibleDate), startOfMonth(visibleDate)) + 1
      : 30

  const eventPropGetter = (event: BigCalendarEvent) => {
    const calendarEvent = event as UICalendarEvent
    const appearance = getCategoryAppearance(calendarEvent.resource.event_type)
    const hasOccurred = calendarEvent.end instanceof Date && calendarEvent.end < new Date()
    const baseStyle = calendarEvent.resource.highlight
      ? {
          background: `linear-gradient(135deg, ${FEATURED_COLORS.surfaceStrong}, ${appearance.surface})`,
          color: appearance.accentDark,
          border: `1px solid ${FEATURED_COLORS.accent}`,
          borderLeft: `0.45rem solid ${FEATURED_COLORS.accentDark}`,
          boxShadow: `0 0 0 1px ${FEATURED_COLORS.halo}, 0 0.45rem 0.85rem ${FEATURED_COLORS.shadow}`,
        }
      : {
          background: appearance.surface,
          color: appearance.accentDark,
          border: `1px solid ${appearance.accent}`,
          borderLeft: `0.45rem solid ${appearance.accent}`,
          boxShadow: 'none',
        }

    if (activeView === 'agenda') {
      return {
        style: hasOccurred
          ? {
              ...baseStyle,
              background: 'var(--gray-100)',
              color: 'var(--gray-500)',
              border: '1px solid var(--gray-300)',
              borderLeft: '0.45rem solid var(--gray-400)',
              opacity: 0.55,
            }
          : baseStyle,
      }
    }

    return {
      style: baseStyle,
    }
  }

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
          date={calendarDate}
          view={activeView}
          views={['month', 'agenda']}
          onNavigate={setVisibleDate}
          onView={(view) => {
            onModeChange(view === 'agenda' ? 'list' : 'month')
          }}
          onSelectEvent={(event) => {
            const calendarEvent = event as UICalendarEvent
            onSelectEvent(calendarEvent.resource.uid)
          }}
          tooltipAccessor={(event) => (event as UICalendarEvent).resource.title}
          components={{
            toolbar: CalendarToolbar,
            event: MonthEventLabel,
            agenda: {
              event: AgendaEventLabel,
            },
          }}
          eventPropGetter={eventPropGetter}
          popup
          step={30}
          length={calendarLength}
          toolbar
        />
      </div>
    </section>
  )
}
