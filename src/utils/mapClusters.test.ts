import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../types/events'
import {
  clusterHasFeaturedEvents,
  getClusterCountLabel,
  getInitialClusterEventIndex,
  sortClusterEventsForBrowse,
} from './mapClusters'

function buildEvent(
  overrides: Partial<CalendarEvent> & Pick<CalendarEvent, 'uid'>,
): CalendarEvent {
  return {
    uid: overrides.uid,
    title: overrides.title ?? overrides.uid,
    description: overrides.description ?? '',
    event_type: overrides.event_type ?? 'music',
    highlight: overrides.highlight ?? false,
    start_date: overrides.start_date ?? '2026-03-20T18:00:00Z',
    end_date: overrides.end_date ?? '2026-03-20T20:00:00Z',
    address: overrides.address ?? 'Champaign, IL',
    lat: overrides.lat ?? 40.1,
    long: overrides.long ?? -88.2,
    url: overrides.url ?? null,
    images: overrides.images ?? [],
  }
}

describe('mapClusters', () => {
  it('detects whether a cluster contains featured events', () => {
    expect(
      clusterHasFeaturedEvents([
        buildEvent({ uid: 'standard' }),
        buildEvent({ uid: 'featured', highlight: true }),
      ]),
    ).toBe(true)

    expect(clusterHasFeaturedEvents([buildEvent({ uid: 'standard' })])).toBe(
      false,
    )
  })

  it('sorts featured events ahead of standard ones, then chronologically', () => {
    const sorted = sortClusterEventsForBrowse([
      buildEvent({
        uid: 'late-standard',
        start_date: '2026-03-22T18:00:00Z',
      }),
      buildEvent({
        uid: 'featured',
        highlight: true,
        start_date: '2026-03-23T18:00:00Z',
      }),
      buildEvent({
        uid: 'early-standard',
        start_date: '2026-03-21T18:00:00Z',
      }),
    ])

    expect(sorted.map((event) => event.uid)).toEqual([
      'featured',
      'early-standard',
      'late-standard',
    ])
  })

  it('starts cluster browsing from the currently selected event when present', () => {
    const clusterEvents = sortClusterEventsForBrowse([
      buildEvent({
        uid: 'earliest',
        start_date: '2026-03-20T18:00:00Z',
      }),
      buildEvent({
        uid: 'selected',
        start_date: '2026-03-21T18:00:00Z',
      }),
      buildEvent({
        uid: 'latest',
        start_date: '2026-03-22T18:00:00Z',
      }),
    ])

    expect(getInitialClusterEventIndex(clusterEvents, 'selected')).toBe(1)
    expect(getInitialClusterEventIndex(clusterEvents, 'missing')).toBe(0)
  })

  it('caps large cluster count labels for compact badges', () => {
    expect(getClusterCountLabel(7)).toBe('7')
    expect(getClusterCountLabel(125)).toBe('99+')
  })
})
