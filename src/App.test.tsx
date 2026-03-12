import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const updateQueryState = vi.fn()
const resetSubmissionState = vi.fn()

vi.mock('./components/MapView', () => ({
  MapView: ({ onSelectEvent }: { onSelectEvent: (uid: string) => void }) => (
    <div>
      <p>MapViewMock</p>
      <button type="button" onClick={() => onSelectEvent('evt-001')}>
        pick-map-event
      </button>
    </div>
  ),
}))

vi.mock('./components/CalendarView', () => ({
  CalendarView: ({ onSelectEvent }: { onSelectEvent: (uid: string) => void }) => (
    <div>
      <p>CalendarViewMock</p>
      <button type="button" onClick={() => onSelectEvent('evt-001')}>
        pick-calendar-event
      </button>
    </div>
  ),
}))

vi.mock('./hooks/useQueryState', () => ({
  useQueryState: () => ({
    queryState: {
      view: 'map',
      category: '',
      start: '',
      end: '',
      q: '',
      event: '',
    },
    updateQueryState,
  }),
}))

vi.mock('./hooks/useEventsData', () => ({
  useEventsData: () => ({
    events: [
      {
        uid: 'evt-001',
        title: 'Event',
        description: 'Desc',
        event_type: 'Music',
        highlight: false,
        start_date: '2026-03-12T19:00:00-05:00',
        end_date: '2026-03-12T21:00:00-05:00',
        address: 'Main St',
        images: [],
      },
    ],
    categories: ['Music'],
    loading: false,
    error: '',
    selectedEvent: null,
  }),
}))

vi.mock('./hooks/useIframeAutoResize', () => ({
  useIframeAutoResize: () => undefined,
}))

vi.mock('./hooks/useSubmissionActions', () => ({
  useSubmissionActions: () => ({
    submissionState: {
      loading: false,
      error: '',
      success: '',
    },
    submitEventRequest: vi.fn().mockResolvedValue(true),
    resetSubmissionState,
  }),
}))

describe('App integration shell', () => {
  beforeEach(() => {
    updateQueryState.mockClear()
    resetSubmissionState.mockClear()
  })

  it('renders default map view and updates query state from controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('MapViewMock')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Calendar' }))
    expect(updateQueryState).toHaveBeenCalledWith({ view: 'calendar' })

    await user.click(screen.getByRole('button', { name: 'Submit Event' }))
    expect(resetSubmissionState).toHaveBeenCalled()
  })

  it('updates selected event from map and list interactions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getAllByRole('button', { name: 'pick-map-event' })[0])

    expect(updateQueryState).toHaveBeenCalledWith({ event: 'evt-001' })
  })
})
