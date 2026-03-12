import { useEffect, useMemo, useState } from 'react'
import { FALLBACK_CATEGORIES } from '../config'
import { createApiClient } from '../api/client'
import type { CalendarEvent } from '../types/events'
import type { QueryState } from '../types/query'
import { dedupeEvents, normalizeEvent } from '../utils/eventNormalization'
import { filterEventsByQuery, sortEventsForDisplay } from '../utils/eventFilters'

interface EventsDataState {
  loading: boolean
  error: string
  events: CalendarEvent[]
  categories: string[]
}

export function useEventsData(queryState: QueryState) {
  const { category, start, end, q, event } = queryState

  const [eventsState, setEventsState] = useState<EventsDataState>({
    loading: true,
    error: '',
    events: [],
    categories: FALLBACK_CATEGORIES,
  })

  useEffect(() => {
    const client = createApiClient()
    let disposed = false

    const getCategories = async () => {
      try {
        const categories = await client.getCategories()
        if (!disposed && categories.length > 0) {
          setEventsState((previous) => ({ ...previous, categories }))
        }
      } catch (error) {
        console.warn('Unable to load categories, falling back to defaults.', error)
      }
    }

    getCategories()

    const loadEvents = async () => {
      setEventsState((previous) => ({ ...previous, loading: true, error: '' }))

      try {
        const raw = await client.getEvents({
          category,
          start,
          end,
          q,
        })

        const normalized = raw
          .map((item) => normalizeEvent(item))
          .filter((item): item is CalendarEvent => item !== null)

        const deduped = dedupeEvents(normalized)
        const filtered = filterEventsByQuery(deduped, { category, start, end, q })
        const sorted = sortEventsForDisplay(filtered)

        if (!disposed) {
          setEventsState((previous) => ({
            ...previous,
            loading: false,
            events: sorted,
          }))
        }
      } catch (error) {
        if (!disposed) {
          setEventsState((previous) => ({
            ...previous,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load events',
            events: [],
          }))
        }
      }
    }

    loadEvents()

    return () => {
      disposed = true
    }
  }, [category, end, q, start])

  const selectedEvent = useMemo(() => {
    if (!event) {
      return null
    }

    return eventsState.events.find((candidate) => candidate.uid === event) ?? null
  }, [event, eventsState.events])

  return {
    ...eventsState,
    selectedEvent,
  }
}
