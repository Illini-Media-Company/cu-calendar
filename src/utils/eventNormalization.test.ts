import { describe, expect, it } from 'vitest'
import { dedupeEvents, normalizeEvent } from './eventNormalization'

describe('event normalization', () => {
  it('normalizes backend payload to frontend event model', () => {
    const normalized = normalizeEvent({
      uid: 'evt-100',
      name: 'Test Event',
      description: 'Description',
      category_type: 'Music',
      start_date: '2026-03-12T20:00:00-05:00',
      end_date: '2026-03-12T22:00:00-05:00',
      address: 'Main Street',
      lat: '40.1',
      long: '-88.2',
      url: 'https://example.org',
      image: 'https://example.org/image.jpg',
    })

    expect(normalized).toMatchObject({
      uid: 'evt-100',
      name: 'Test Event',
      categoryType: 'Music',
      lat: 40.1,
      long: -88.2,
    })

    expect(normalized?.startDate).toContain('2026-03-13T01:00:00.000Z')
  })

  it('returns null when required fields are missing', () => {
    expect(
      normalizeEvent({
        uid: 'evt-100',
        startDate: '2026-03-10T10:00:00-05:00',
      }),
    ).toBeNull()
  })

  it('removes duplicate events by uid', () => {
    const baseEvent = normalizeEvent({
      uid: 'evt-1',
      name: 'One',
      startDate: '2026-03-10T10:00:00-05:00',
      endDate: '2026-03-10T11:00:00-05:00',
      address: 'Address',
    })

    expect(baseEvent).not.toBeNull()

    const deduped = dedupeEvents([baseEvent!, baseEvent!, { ...baseEvent!, uid: 'evt-2' }])
    expect(deduped.map((item) => item.uid)).toEqual(['evt-1', 'evt-2'])
  })
})
