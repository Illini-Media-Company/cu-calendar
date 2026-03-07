import { describe, expect, it } from 'vitest'
import { parseQueryState, serializeQueryState } from './queryState'

describe('queryState utilities', () => {
  it('parses known query parameters', () => {
    const parsed = parseQueryState(
      '?view=calendar&category=Music&start=2026-03-01&end=2026-03-31&q=jazz&event=evt-001',
    )

    expect(parsed).toEqual({
      view: 'calendar',
      category: 'Music',
      start: '2026-03-01',
      end: '2026-03-31',
      q: 'jazz',
      event: 'evt-001',
    })
  })

  it('falls back to map when view is invalid', () => {
    const parsed = parseQueryState('?view=invalid')
    expect(parsed.view).toBe('map')
  })

  it('serializes state into URL params without defaults', () => {
    const serialized = serializeQueryState({
      view: 'calendar',
      category: 'Food',
      start: '2026-03-10',
      end: '',
      q: 'market',
      event: 'evt-005',
    })

    expect(serialized).toBe('?view=calendar&category=Food&start=2026-03-10&q=market&event=evt-005')
  })
})
