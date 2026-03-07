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

type FormVariant = 'submission' | 'change' | null

function shouldClearEventSelection(patch: Partial<QueryState>): boolean {
  return ['category', 'start', 'end', 'q'].some((key) => key in patch)
}

function App() {
  const containerRef = useRef<HTMLElement | null>(null)
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month')
  const [formVariant, setFormVariant] = useState<FormVariant>(null)

  const { queryState, updateQueryState } = useQueryState()
  const { events, categories, loading, error, selectedEvent } = useEventsData(queryState)
  const {
    submissionState,
    submitEventRequest,
    submitChangeRequest,
    resetSubmissionState,
  } = useSubmissionActions()

  useIframeAutoResize(containerRef)

  const handleQueryChange = (patch: Partial<QueryState>) => {
    if (shouldClearEventSelection(patch) && !('event' in patch)) {
      updateQueryState({ ...patch, event: '' })
      return
    }

    updateQueryState(patch)
  }

  const activeForm = useMemo(() => {
    if (!formVariant) {
      return null
    }

    return (
      <PublicEventForm
        variant={formVariant}
        categories={categories}
        loading={submissionState.loading}
        successMessage={submissionState.success}
        errorMessage={submissionState.error}
        onClose={() => setFormVariant(null)}
        onResetStatus={resetSubmissionState}
        onSubmit={formVariant === 'submission' ? submitEventRequest : submitChangeRequest}
      />
    )
  }, [
    categories,
    formVariant,
    resetSubmissionState,
    submissionState.error,
    submissionState.loading,
    submissionState.success,
    submitChangeRequest,
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
        <button
          type="button"
          className={`button-primary ${styles.primaryButton}`}
          onClick={() => {
            resetSubmissionState()
            setFormVariant('submission')
          }}
        >
          Submit Event
        </button>
        <button
          type="button"
          className={`button-secondary ${styles.secondaryButton}`}
          onClick={() => {
            resetSubmissionState()
            setFormVariant('change')
          }}
        >
          Request Change
        </button>
      </section>

      {activeForm ? <div className={styles.formOverlay}>{activeForm}</div> : null}
    </main>
  )
}

export default App
