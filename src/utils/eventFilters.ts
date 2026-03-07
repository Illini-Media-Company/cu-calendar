import type { CalendarEvent } from '../types/events'
import type { QueryState } from '../types/query'

function inDateRange(event: CalendarEvent, start: string, end: string): boolean {
  const eventStart = new Date(event.startDate)

  if (Number.isNaN(eventStart.valueOf())) {
    return false
  }

  if (start) {
    const startDate = new Date(`${start}T00:00:00`)
    if (eventStart < startDate) {
      return false
    }
  }

  if (end) {
    const endDate = new Date(`${end}T23:59:59.999`)
    if (eventStart > endDate) {
      return false
    }
  }

  return true
}

function textIncludes(event: CalendarEvent, query: string): boolean {
  if (!query) {
    return true
  }

  const normalized = query.toLowerCase()
  return [event.name, event.description, event.address, event.categoryType]
    .join(' ')
    .toLowerCase()
    .includes(normalized)
}

export function filterEventsByQuery(
  events: CalendarEvent[],
  queryState: Pick<QueryState, 'category' | 'start' | 'end' | 'q'>,
): CalendarEvent[] {
  return events.filter((event) => {
    const categoryMatch =
      !queryState.category || event.categoryType === queryState.category

    return (
      categoryMatch &&
      inDateRange(event, queryState.start, queryState.end) &&
      textIncludes(event, queryState.q)
    )
  })
}

export function sortEventsByStartDate(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    return new Date(a.startDate).valueOf() - new Date(b.startDate).valueOf()
  })
}
