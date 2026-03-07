import type { CalendarView } from './events'

export interface QueryState {
  view: CalendarView
  category: string
  start: string
  end: string
  q: string
  event: string
}

export const DEFAULT_QUERY_STATE: QueryState = {
  view: 'map',
  category: '',
  start: '',
  end: '',
  q: '',
  event: '',
}
