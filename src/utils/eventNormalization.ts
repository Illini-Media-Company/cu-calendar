import type { CalendarEvent, RawEventPayload } from '../types/events'

function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return null
}

function asOptionalNumber(value: unknown): number | null {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function asIsoDate(value: unknown): string | null {
  const str = asString(value)
  if (!str) {
    return null
  }

  const parsed = new Date(str)
  if (Number.isNaN(parsed.valueOf())) {
    return null
  }

  return parsed.toISOString()
}

export function normalizeEvent(payload: RawEventPayload): CalendarEvent | null {
  const uid = asString(payload.uid)
  const name = asString(payload.name)
  const description = asString(payload.description) ?? ''
  const categoryType =
    asString(payload.categoryType) ?? asString(payload.category_type) ?? 'Uncategorized'
  const startDate = asIsoDate(payload.startDate ?? payload.start_date)
  const endDate = asIsoDate(payload.endDate ?? payload.end_date)
  const address = asString(payload.address) ?? 'Address pending'

  if (!uid || !name || !startDate || !endDate) {
    return null
  }

  return {
    uid,
    name,
    description,
    categoryType,
    startDate,
    endDate,
    address,
    lat: asOptionalNumber(payload.lat),
    long: asOptionalNumber(payload.long),
    url: asString(payload.url),
    image: asString(payload.image),
  }
}

export function dedupeEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>()

  return events.filter((event) => {
    if (seen.has(event.uid)) {
      return false
    }

    seen.add(event.uid)
    return true
  })
}
