import { describe, expect, it } from 'vitest'
import { getEventMarkerZIndex } from './mapMarkerOrder'

const now = new Date('2026-03-12T12:00:00Z').valueOf()

describe('getEventMarkerZIndex', () => {
  it('keeps the selected event above all other markers', () => {
    const selected = getEventMarkerZIndex(
      { uid: 'evt-selected', start_date: '2026-04-01T18:00:00Z', highlight: false },
      'evt-selected',
      now,
    )
    const other = getEventMarkerZIndex(
      { uid: 'evt-other', start_date: '2026-03-12T12:05:00Z', highlight: true },
      'evt-selected',
      now,
    )

    expect(selected).toBeGreaterThan(other)
  })

  it('puts sooner upcoming events above later upcoming events', () => {
    const sooner = getEventMarkerZIndex(
      { uid: 'evt-sooner', start_date: '2026-03-12T12:05:00Z', highlight: false },
      '',
      now,
    )
    const later = getEventMarkerZIndex(
      { uid: 'evt-later', start_date: '2026-03-20T12:00:00Z', highlight: false },
      '',
      now,
    )

    expect(sooner).toBeGreaterThan(later)
  })

  it('puts upcoming events above past events', () => {
    const upcoming = getEventMarkerZIndex(
      { uid: 'evt-upcoming', start_date: '2026-03-12T12:05:00Z', highlight: false },
      '',
      now,
    )
    const past = getEventMarkerZIndex(
      { uid: 'evt-past', start_date: '2026-03-12T11:55:00Z', highlight: false },
      '',
      now,
    )

    expect(upcoming).toBeGreaterThan(past)
  })

  it('puts more recent past events above older past events', () => {
    const recentPast = getEventMarkerZIndex(
      { uid: 'evt-recent', start_date: '2026-03-12T11:55:00Z', highlight: false },
      '',
      now,
    )
    const olderPast = getEventMarkerZIndex(
      { uid: 'evt-old', start_date: '2026-02-12T11:55:00Z', highlight: false },
      '',
      now,
    )

    expect(recentPast).toBeGreaterThan(olderPast)
  })

  it('puts featured markers above standard markers', () => {
    const featured = getEventMarkerZIndex(
      { uid: 'evt-featured', start_date: '2026-03-12T12:05:00Z', highlight: true },
      '',
      now,
    )
    const standard = getEventMarkerZIndex(
      { uid: 'evt-standard', start_date: '2026-03-12T12:05:00Z', highlight: false },
      '',
      now,
    )

    expect(featured).toBeGreaterThan(standard)
  })
})
