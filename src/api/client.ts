import { APP_CONFIG } from '../config'
import type { EventQueryParams, RawEventPayload } from '../types/events'
import { createLiveApiClient } from './liveApiClient'
import { createMockApiClient } from './mockApiClient'

export interface ApiClient {
  getEvents(params: EventQueryParams): Promise<RawEventPayload[]>
  getCategories(): Promise<string[]>
  submitEventRequest(payload: FormData): Promise<void>
}

let singleton: ApiClient | null = null

export function createApiClient(): ApiClient {
  if (singleton) {
    return singleton
  }

  singleton = APP_CONFIG.useMockApi
    ? createMockApiClient()
    : createLiveApiClient(APP_CONFIG.apiBaseUrl)

  return singleton
}
