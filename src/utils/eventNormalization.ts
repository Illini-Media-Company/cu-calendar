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

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => asString(entry))
    .filter((entry): entry is string => entry !== null)
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value !== 0
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return ['true', '1', 'yes', 'y', 'featured'].includes(normalized)
  }

  return false
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
  const title = asString(payload.title) ?? asString(payload.name)
  const description = asString(payload.description) ?? ''
  const event_type =
    asString(payload.event_type) ??
    asString(payload.categoryType) ??
    asString(payload.category_type) ??
    'Uncategorized'
  const start_date = asIsoDate(payload.start_date ?? payload.startDate)
  const end_date = asIsoDate(payload.end_date ?? payload.endDate)
  const address = asString(payload.address) ?? 'Address pending'
  const images = asStringArray(payload.images)
  const image = asString(payload.image)
  const normalizedImages = [...new Set(image ? [image, ...images] : images)]

  if (!uid || !title || !start_date || !end_date) {
    return null
  }

  return {
    uid,
    title,
    description,
    event_type,
    highlight: asBoolean(
      payload.highlight ?? payload.isFeatured ?? payload.is_featured,
    ),
    start_date,
    end_date,
    address,
    lat: asOptionalNumber(payload.lat),
    long: asOptionalNumber(payload.long),
    url: asString(payload.url),
    images: normalizedImages,
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
