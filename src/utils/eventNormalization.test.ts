import { describe, expect, it } from 'vitest'
import { dedupeEvents, normalizeEvent } from './eventNormalization'

describe('event normalization', () => {
  it('normalizes backend payload to the app event model', () => {
    const normalized = normalizeEvent({
      uid: 'evt-100',
      title: 'Test Event',
      description: 'Description',
      event_type: 'Music',
      highlight: 'true',
      start_date: '2026-03-12T20:00:00-05:00',
      end_date: '2026-03-12T22:00:00-05:00',
      address: 'Main Street',
      lat: '40.1',
      long: '-88.2',
      url: 'https://example.org',
      images: ['https://example.org/image.jpg'],
    })

    expect(normalized).toMatchObject({
      uid: 'evt-100',
      title: 'Test Event',
      event_type: 'Music',
      highlight: true,
      lat: 40.1,
      long: -88.2,
      images: ['https://example.org/image.jpg'],
    })

    expect(normalized?.start_date).toContain('2026-03-13T01:00:00.000Z')
  })

  it('returns null when required fields are missing', () => {
    expect(
      normalizeEvent({
        uid: 'evt-100',
        start_date: '2026-03-10T10:00:00-05:00',
      }),
    ).toBeNull()
  })

  it('defaults featured status to false when missing', () => {
    const normalized = normalizeEvent({
      uid: 'evt-101',
      title: 'Plain Event',
      start_date: '2026-03-10T10:00:00-05:00',
      end_date: '2026-03-10T11:00:00-05:00',
      address: 'Address',
    })

    expect(normalized?.highlight).toBe(false)
  })

  it('accepts the central backend field names directly', () => {
    const normalized = normalizeEvent({
      uid: 42,
      title: 'Backend Event',
      description: 'From NDB',
      event_type: 'Community',
      highlight: true,
      start_date: '2026-03-10T10:00:00-05:00',
      end_date: '2026-03-10T11:00:00-05:00',
      address: 'Address',
      lat: 40.1,
      long: -88.2,
      images: ['https://example.org/first.jpg', 'https://example.org/second.jpg'],
    })

    expect(normalized).toMatchObject({
      uid: '42',
      title: 'Backend Event',
      event_type: 'Community',
      highlight: true,
      images: ['https://example.org/first.jpg', 'https://example.org/second.jpg'],
    })
  })

  it('still accepts legacy camelCase fields', () => {
    const normalized = normalizeEvent({
      uid: 'evt-102',
      name: 'Featured Event',
      isFeatured: 1,
      startDate: '2026-03-10T10:00:00-05:00',
      endDate: '2026-03-10T11:00:00-05:00',
      address: 'Address',
    })

    expect(normalized?.title).toBe('Featured Event')
    expect(normalized?.highlight).toBe(true)
  })

  it('removes duplicate events by uid', () => {
    const baseEvent = normalizeEvent({
      uid: 'evt-1',
      title: 'One',
      start_date: '2026-03-10T10:00:00-05:00',
      end_date: '2026-03-10T11:00:00-05:00',
      address: 'Address',
    })

    expect(baseEvent).not.toBeNull()

    const deduped = dedupeEvents([baseEvent!, baseEvent!, { ...baseEvent!, uid: 'evt-2' }])
    expect(deduped.map((item) => item.uid)).toEqual(['evt-1', 'evt-2'])
  })
})
