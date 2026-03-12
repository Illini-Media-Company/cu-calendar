import { useMemo, useRef, useState } from 'react'
import { FilterToolbar } from './components/FilterToolbar'
import { ShellHeader } from './components/ShellHeader'
import { MapView } from './components/MapView'
import { CalendarView } from './components/CalendarView'
import { EventDetailsPanel } from './components/EventDetailsPanel'
import { EventList } from './components/EventList'
import { PublicEventForm } from './components/forms/PublicEventForm'
import { useQueryState } from './hooks/useQueryState'
import { useEventsData } from './hooks/useEventsData'
import type { CalendarMode } from './types/events'
import { useIframeAutoResize } from './hooks/useIframeAutoResize'
import { useSubmissionActions } from './hooks/useSubmissionActions'
import type { QueryState } from './types/query'
import styles from './styles/App.module.css'

function shouldClearEventSelection(patch: Partial<QueryState>): boolean {
  return ['category', 'start', 'end', 'q'].some((key) => key in patch)
}

function App() {
  const containerRef = useRef<HTMLElement | null>(null)
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month')
  const [isSubmissionFormOpen, setIsSubmissionFormOpen] = useState(false)

  const { queryState, updateQueryState } = useQueryState()
  const { events, categories, loading, error, selectedEvent } = useEventsData(queryState)
  const { submissionState, submitEventRequest, resetSubmissionState } =
    useSubmissionActions()

  useIframeAutoResize(containerRef)

  const handleQueryChange = (patch: Partial<QueryState>) => {
    if (shouldClearEventSelection(patch) && !('event' in patch)) {
      updateQueryState({ ...patch, event: '' })
      return
    }

    updateQueryState(patch)
  }

  const activeForm = useMemo(() => {
    if (!isSubmissionFormOpen) {
      return null
    }

    return (
      <PublicEventForm
        categories={categories}
        loading={submissionState.loading}
        successMessage={submissionState.success}
        errorMessage={submissionState.error}
        onClose={() => setIsSubmissionFormOpen(false)}
        onResetStatus={resetSubmissionState}
        onSubmit={submitEventRequest}
      />
    )
  }, [
    categories,
    isSubmissionFormOpen,
    resetSubmissionState,
    submissionState.error,
    submissionState.loading,
    submissionState.success,
    submitEventRequest,
  ])

  return (
    <main className={styles.appShell} ref={containerRef}>
      <ShellHeader />

      <FilterToolbar
        queryState={queryState}
        categories={categories}
        onQueryChange={handleQueryChange}
      />

      <section className={styles.statusRow} aria-live="polite">
        <p>{loading ? 'Loading events...' : `${events.length} events loaded`}</p>
        {error ? <p className={styles.errorMessage}>Error: {error}</p> : null}
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainPanel}>
          {queryState.view === 'map' ? (
            <MapView
              events={events}
              selectedEventUid={queryState.event}
              onSelectEvent={(uid) => handleQueryChange({ event: uid })}
            />
          ) : (
            <CalendarView
              events={events}
              mode={calendarMode}
              onModeChange={setCalendarMode}
              onSelectEvent={(uid) => handleQueryChange({ event: uid })}
            />
          )}

          <EventList
            events={events}
            selectedEventUid={queryState.event}
            onSelectEvent={(uid) => handleQueryChange({ event: uid })}
          />
        </div>

        <EventDetailsPanel event={selectedEvent} onClear={() => handleQueryChange({ event: '' })} />
      </section>

      <section className={styles.bottomActions}>
        <p className={styles.bottomActionsMessage}>
          Want your organization&apos;s events on the CU Calendar? Submit them here.
        </p>
        <button
          type="button"
          className={`button-primary ${styles.primaryButton}`}
          onClick={() => {
            resetSubmissionState()
            setIsSubmissionFormOpen(true)
          }}
        >
          Submit Event
        </button>
      </section>

      {activeForm ? <div className={styles.formOverlay}>{activeForm}</div> : null}
    </main>
  )
}

export default App
