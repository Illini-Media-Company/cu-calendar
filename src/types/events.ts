export type CalendarView = 'map' | 'calendar'
export type CalendarMode = 'month' | 'list'

export interface CalendarEvent {
  uid: string
  name: string
  description: string
  categoryType: string
  startDate: string
  endDate: string
  address: string
  lat?: number | null
  long?: number | null
  url?: string | null
  image?: string | null
}

export interface RawEventPayload {
  uid?: unknown
  name?: unknown
  description?: unknown
  categoryType?: unknown
  category_type?: unknown
  startDate?: unknown
  start_date?: unknown
  endDate?: unknown
  end_date?: unknown
  address?: unknown
  lat?: unknown
  long?: unknown
  url?: unknown
  image?: unknown
}

export interface EventQueryParams {
  category?: string
  start?: string
  end?: string
  q?: string
}

export interface EventSubmissionFields {
  name: string
  description: string
  categoryType: string
  startDate: string
  endDate: string
  address: string
  url?: string
  submitterName: string
  submitterEmail: string
  organization: string
}

export interface EventChangeRequestFields extends EventSubmissionFields {
  eventUid: string
  requestedChanges: string
}
