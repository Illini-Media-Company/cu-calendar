import type { CalendarEvent } from '../types/events'
import { compareEventsForDisplay } from './featuredEvents'

const MAX_CLUSTER_COUNT_LABEL = 99

export function clusterHasFeaturedEvents(events: CalendarEvent[]): boolean {
  return events.some((event) => event.highlight)
}

export function sortClusterEventsForBrowse(
  events: CalendarEvent[],
): CalendarEvent[] {
  return [...events].sort(compareEventsForDisplay)
}

export function getInitialClusterEventIndex(
  events: CalendarEvent[],
  selectedEventUid: string,
): number {
  if (!selectedEventUid) {
    return 0
  }

  const selectedIndex = events.findIndex((event) => event.uid === selectedEventUid)
  return selectedIndex >= 0 ? selectedIndex : 0
}

export function getClusterCountLabel(count: number): string {
  return count > MAX_CLUSTER_COUNT_LABEL
    ? `${MAX_CLUSTER_COUNT_LABEL}+`
    : String(count)
}
