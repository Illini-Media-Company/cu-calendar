import { describe, expect, it } from 'vitest'
import { filterEventsByQuery, sortEventsByStartDate } from './eventFilters'
import { MOCK_EVENTS } from '../mocks/events'

describe('event filter utilities', () => {
  it('filters by category and text query', () => {
    const filtered = filterEventsByQuery(MOCK_EVENTS, {
      category: 'Arts',
      start: '',
      end: '',
      q: 'poetry',
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].uid).toBe('evt-006')
  })

  it('filters by start and end date range', () => {
    const filtered = filterEventsByQuery(MOCK_EVENTS, {
      category: '',
      start: '2026-03-14',
      end: '2026-03-15',
      q: '',
    })

    expect(filtered.map((event) => event.uid)).toEqual(['evt-002', 'evt-003'])
  })

  it('sorts events chronologically', () => {
    const sorted = sortEventsByStartDate([MOCK_EVENTS[4], MOCK_EVENTS[0]])
    expect(sorted.map((event) => event.uid)).toEqual(['evt-001', 'evt-005'])
  })
})
