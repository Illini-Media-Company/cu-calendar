export type CalendarView = 'map' | 'calendar'
export type CalendarMode = 'month' | 'list'

export interface CalendarEvent {
  uid: string
  title: string
  description: string
  event_type: string
  highlight: boolean
  start_date: string
  end_date: string
  address: string
  lat?: number | null
  long?: number | null
  url?: string | null
  images: string[]
}

export interface RawEventPayload {
  uid?: unknown
  title?: unknown
  name?: unknown
  description?: unknown
  event_type?: unknown
  categoryType?: unknown
  category_type?: unknown
  highlight?: unknown
  isFeatured?: unknown
  is_featured?: unknown
  start_date?: unknown
  startDate?: unknown
  end_date?: unknown
  endDate?: unknown
  address?: unknown
  lat?: unknown
  long?: unknown
  url?: unknown
  images?: unknown
  image?: unknown
}

export interface EventQueryParams {
  category?: string
  start?: string
  end?: string
  q?: string
}

export interface EventSubmissionFields {
  title: string
  description: string
  event_type: string
  start_date: string
  end_date: string
  address: string
  url?: string
  submitter_name: string
  submitter_email: string
  company_name: string
}
