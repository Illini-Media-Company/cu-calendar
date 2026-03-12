import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLiveApiClient } from './liveApiClient'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('liveApiClient', () => {
  it('requests events with query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ uid: 'evt-1' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    globalThis.fetch = fetchMock as unknown as typeof fetch

    const client = createLiveApiClient('https://api.example.org')
    const result = await client.getEvents({
      category: 'Music',
      start: '2026-03-01',
      end: '2026-03-31',
      q: 'jazz',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.example.org/api/events?category=Music&start=2026-03-01&end=2026-03-31&q=jazz',
    )
    expect(result).toEqual([{ uid: 'evt-1' }])
  })

  it('posts multipart form data for submissions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    globalThis.fetch = fetchMock as unknown as typeof fetch

    const client = createLiveApiClient('')
    const payload = new FormData()
    payload.set('title', 'Event')

    await client.submitEventRequest(payload)

    expect(fetchMock).toHaveBeenCalledWith('/api/events/submissions', {
      method: 'POST',
      body: payload,
    })
  })

  it('throws response message when request fails', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ message: 'No access' }), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }),
      ) as unknown as typeof fetch

    const client = createLiveApiClient('')

    await expect(client.getCategories()).rejects.toThrow('No access')
  })
})
