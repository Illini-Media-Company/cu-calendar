import { DEFAULT_QUERY_STATE, type QueryState } from '../types/query'

const VIEW_VALUES = new Set(['map', 'calendar'])

export function parseQueryState(search: string): QueryState {
  const params = new URLSearchParams(search)
  const viewParam = params.get('view')

  return {
    view: VIEW_VALUES.has(viewParam ?? '')
      ? (viewParam as QueryState['view'])
      : DEFAULT_QUERY_STATE.view,
    category: params.get('category') ?? DEFAULT_QUERY_STATE.category,
    start: params.get('start') ?? DEFAULT_QUERY_STATE.start,
    end: params.get('end') ?? DEFAULT_QUERY_STATE.end,
    q: params.get('q') ?? DEFAULT_QUERY_STATE.q,
    event: params.get('event') ?? DEFAULT_QUERY_STATE.event,
  }
}

export function serializeQueryState(state: QueryState): string {
  const params = new URLSearchParams()

  if (state.view !== DEFAULT_QUERY_STATE.view) {
    params.set('view', state.view)
  }
  if (state.category) {
    params.set('category', state.category)
  }
  if (state.start) {
    params.set('start', state.start)
  }
  if (state.end) {
    params.set('end', state.end)
  }
  if (state.q) {
    params.set('q', state.q)
  }
  if (state.event) {
    params.set('event', state.event)
  }

  const value = params.toString()
  return value ? `?${value}` : ''
}

export function mergeQueryState(
  current: QueryState,
  patch: Partial<QueryState>,
): QueryState {
  return {
    ...current,
    ...patch,
  }
}
