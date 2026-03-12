import type { CalendarEvent } from '../types/events'

export const FEATURED_LABEL = 'Featured'
export const FEATURED_BADGE_CLASS_NAME = 'cu-featured-badge'
export const FEATURED_BADGE_COMPACT_CLASS_NAME = 'cu-featured-badge--compact'

export const FEATURED_COLORS = {
  accent: '#f9a825',
  accentDark: '#8d5301',
  surface: '#fff8db',
  surfaceStrong: '#fff3c4',
  halo: '#ffe082',
  shadow: 'rgba(249, 168, 37, 0.34)',
} as const

export function compareEventsForDisplay(a: CalendarEvent, b: CalendarEvent): number {
  if (a.highlight !== b.highlight) {
    return Number(b.highlight) - Number(a.highlight)
  }

  const startDiff = new Date(a.start_date).valueOf() - new Date(b.start_date).valueOf()
  if (startDiff !== 0) {
    return startDiff
  }

  return a.uid.localeCompare(b.uid)
}

export function buildFeaturedBadgeHtml(compact = false): string {
  const compactClass = compact ? ` ${FEATURED_BADGE_COMPACT_CLASS_NAME}` : ''

  return `
    <span class="${FEATURED_BADGE_CLASS_NAME}${compactClass}">
      <i class="bi bi-star-fill" aria-hidden="true"></i>
      <span>${FEATURED_LABEL}</span>
    </span>
  `
}
