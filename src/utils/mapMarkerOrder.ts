import type { CalendarEvent } from '../types/events'

const SELECTED_MARKER_Z_INDEX = 2_200_000_000
const FEATURED_UPCOMING_Z_INDEX_BASE = 2_100_000_000
const FEATURED_PAST_Z_INDEX_BASE = 2_000_000_000
const STANDARD_UPCOMING_Z_INDEX_BASE = 1_900_000_000
const MINUTES_PER_MILLISECOND = 60_000

export function getEventMarkerZIndex(
  event: Pick<CalendarEvent, 'uid' | 'start_date' | 'highlight'>,
  selectedEventUid: string,
  now = Date.now(),
): number {
  if (event.uid === selectedEventUid) {
    return SELECTED_MARKER_Z_INDEX
  }

  const startMs = new Date(event.start_date).valueOf()

  if (!Number.isFinite(startMs)) {
    return 0
  }

  const startMinutes = Math.floor(startMs / MINUTES_PER_MILLISECOND)

  if (event.highlight) {
    if (startMs >= now) {
      return FEATURED_UPCOMING_Z_INDEX_BASE - startMinutes
    }

    return FEATURED_PAST_Z_INDEX_BASE + startMinutes
  }

  if (startMs >= now) {
    return STANDARD_UPCOMING_Z_INDEX_BASE - startMinutes
  }

  return startMinutes
}
