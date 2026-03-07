import type { ApiClient } from './client'
import type { EventQueryParams, RawEventPayload } from '../types/events'

function joinPath(baseUrl: string, path: string): string {
  if (!baseUrl) {
    return path
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${normalizedBase}${path}`
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function expectOk(response: Response): Promise<unknown> {
  const payload = await parseResponse(response)

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : (payload as { message?: string })?.message ?? 'API request failed'
    throw new Error(message)
  }

  return payload
}

export function createLiveApiClient(baseUrl: string): ApiClient {
  return {
    async getEvents(params: EventQueryParams): Promise<RawEventPayload[]> {
      const searchParams = new URLSearchParams()

      if (params.category) {
        searchParams.set('category', params.category)
      }
      if (params.start) {
        searchParams.set('start', params.start)
      }
      if (params.end) {
        searchParams.set('end', params.end)
      }
      if (params.q) {
        searchParams.set('q', params.q)
      }

      const query = searchParams.toString()
      const url = `${joinPath(baseUrl, '/api/events')}${query ? `?${query}` : ''}`

      const response = await fetch(url)
      const payload = (await expectOk(response)) as unknown

      if (!Array.isArray(payload)) {
        throw new Error('Events response was not an array')
      }

      return payload as RawEventPayload[]
    },

    async getCategories(): Promise<string[]> {
      const response = await fetch(joinPath(baseUrl, '/api/events/categories'))
      const payload = (await expectOk(response)) as unknown

      if (!Array.isArray(payload)) {
        throw new Error('Category response was not an array')
      }

      return payload.filter((entry): entry is string => typeof entry === 'string')
    },

    async submitEventRequest(formData: FormData): Promise<void> {
      const response = await fetch(joinPath(baseUrl, '/api/events/submissions'), {
        method: 'POST',
        body: formData,
      })

      await expectOk(response)
    },

    async submitChangeRequest(formData: FormData): Promise<void> {
      const response = await fetch(joinPath(baseUrl, '/api/events/change-requests'), {
        method: 'POST',
        body: formData,
      })

      await expectOk(response)
    },
  }
}
