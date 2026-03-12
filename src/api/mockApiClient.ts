import { FALLBACK_CATEGORIES } from '../config'
import { MOCK_EVENTS } from '../mocks/events'
import type { EventQueryParams, RawEventPayload } from '../types/events'
import { filterEventsByQuery } from '../utils/eventFilters'
import type { ApiClient } from './client'

function wait(delayMs = 250): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delayMs)
  })
}

function toRawEventPayload(event: (typeof MOCK_EVENTS)[number]): RawEventPayload {
  return {
    uid: event.uid,
    title: event.title,
    description: event.description,
    event_type: event.event_type,
    highlight: event.highlight,
    start_date: event.start_date,
    end_date: event.end_date,
    address: event.address,
    lat: event.lat,
    long: event.long,
    url: event.url,
    images: event.images,
  }
}

export function createMockApiClient(): ApiClient {
  return {
    async getEvents(params: EventQueryParams): Promise<RawEventPayload[]> {
      await wait()

      const filtered = filterEventsByQuery(MOCK_EVENTS, {
        category: params.category ?? '',
        start: params.start ?? '',
        end: params.end ?? '',
        q: params.q ?? '',
      })

      return filtered.map(toRawEventPayload)
    },

    async getCategories(): Promise<string[]> {
      await wait(150)
      return [...new Set([...FALLBACK_CATEGORIES, ...MOCK_EVENTS.map((e) => e.event_type)])]
    },

    async submitEventRequest(formData: FormData): Promise<void> {
      await wait()
      console.info('Mock submission accepted', Object.fromEntries(formData.entries()))
    },
  }
}
