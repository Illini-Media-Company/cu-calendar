import { useCallback, useEffect, useMemo, useState } from 'react'
import type { QueryState } from '../types/query'
import { mergeQueryState, parseQueryState, serializeQueryState } from '../utils/queryState'

export function useQueryState() {
  const [state, setState] = useState<QueryState>(() =>
    parseQueryState(window.location.search),
  )

  useEffect(() => {
    const onPopState = () => {
      setState(parseQueryState(window.location.search))
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const updateState = useCallback((patch: Partial<QueryState>) => {
    setState((previous) => {
      const next = mergeQueryState(previous, patch)
      const query = serializeQueryState(next)
      const nextUrl = `${window.location.pathname}${query}`
      window.history.replaceState({}, '', nextUrl)
      return next
    })
  }, [])

  return useMemo(
    () => ({
      queryState: state,
      updateQueryState: updateState,
    }),
    [state, updateState],
  )
}
